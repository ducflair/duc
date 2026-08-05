"""Scoped model-element search helpers.

Model elements (``DucModelElement``, element type ``"model"``) embed CAD/BIM
content in one of two ways:

1. **Embedded Python code** (``model_type == "python"``) whose imports reveal
   the real engine — ``ezdxf``, ``ifcopenshell`` or ``build123d``.
2. **Linked external files** (``model_type`` is ``dxf`` / ``ifc`` / ``step`` /
   ...) whose blobs live in the connected external files (``file_ids``).

Before any content can be searched we must classify each model into the engine
that produced it:

============  ===========================================================
Engine        Sources
============  ===========================================================
ezdxf         ``model_type`` ``dxf`` / ``dwg``, or Python importing ``ezdxf``
ifc           ``model_type`` ``ifc``, or Python importing ``ifcopenshell``
build123d     ``model_type`` ``step`` / ``stl``, or Python importing ``build123d``
unsupported   anything we can't classify
============  ===========================================================

This module detects each engine and searches user-facing content for the ezdxf
and IFC engines. Build123d elements currently remain searchable through their
DUC label and description.
"""

from __future__ import annotations

import ast
import json
import logging
import re
import sqlite3
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Iterable, Iterator

from ..builders.sql_builder import DucSQL
from ..parse import parse_duc
from .search_elements import (
    DucSearchResponse,
    _build_match_contexts,
    _build_query_variants,
    _build_result_payloads,
    _ElementAggregate,
    _evaluate_match_text,
    _tokenize,
)
from .search_ezdxf import extract_model_dxf_text
from .search_ifc import extract_model_ifc_text

logger = logging.getLogger(__name__)

__all__ = [
    "DucSearchResponse",
    "ModelElementInfo",
    "ModelEngine",
    "detect_model_engine",
    "extract_python_imports",
    "iter_model_elements",
    "model_element_info",
    "resolve_model_search_targets",
    "search_duc_models",
]

MODEL_ELEMENT_TYPE = "model"
_PYTHON_MODEL_TYPE = "python"


class ModelEngine(str, Enum):
    """CAD/BIM engine responsible for a model element's content."""

    EZDXF = "ezdxf"
    IFC = "ifc"
    BUILD123D = "build123d"
    UNSUPPORTED = "unsupported"


# Detection priority order: ezdxf -> ifc -> build123d -> unsupported.
# Used when Python code imports more than one recognised engine.
_ENGINE_PRIORITY: tuple[ModelEngine, ...] = (
    ModelEngine.EZDXF,
    ModelEngine.IFC,
    ModelEngine.BUILD123D,
)

# Direct (non-Python) ``model_type`` -> engine.
_MODEL_TYPE_ENGINES: dict[str, ModelEngine] = {
    "dxf": ModelEngine.EZDXF,
    "dwg": ModelEngine.EZDXF,
    "ifc": ModelEngine.IFC,
    "step": ModelEngine.BUILD123D,
    "stl": ModelEngine.BUILD123D,
}

# Top-level imported module -> engine (for ``model_type == "python"``).
_IMPORT_ENGINES: dict[str, ModelEngine] = {
    "ezdxf": ModelEngine.EZDXF,
    "ifcopenshell": ModelEngine.IFC,
    "build123d": ModelEngine.BUILD123D,
}

# Fallback parser for code that ``ast`` can't handle (fragments / syntax errors).
_IMPORT_RE = re.compile(r"^\s*(?:from\s+([.\w]+)\s+import\b|import\s+(.+))", re.MULTILINE)

# Relevance weights for an element's own text fields.
_BASE_FIELD_WEIGHTS: dict[str, float] = {"label": 0.8, "description": 0.9}

# Relevance weights per extracted-text kind. Human annotations rank above the
# structural names (layers/blocks/layouts) and extended data.
_DXF_KIND_WEIGHTS: dict[str, float] = {
    "text": 0.97,
    "mtext": 0.97,
    "attrib": 0.95,
    "dimension": 0.95,
    "mleader": 0.95,
    "table": 0.95,
    "attdef": 0.9,
    "hyperlink": 0.7,
    "xdata": 0.7,
    "doc_property": 0.7,
    "layer": 0.6,
    "block": 0.6,
    "layout": 0.6,
}

_IFC_KIND_WEIGHTS: dict[str, float] = {
    "property": 0.97,
    "quantity": 0.95,
    "document": 0.95,
    "classification": 0.9,
    "material": 0.9,
    "actor": 0.8,
    "address": 0.8,
    "attribute": 0.85,
    "presentation_layer": 0.65,
    "header": 0.7,
}


@dataclass(frozen=True, slots=True)
class ModelElementInfo:
    """Engine classification of a single model element."""

    element_id: str
    label: str
    model_type: str  # normalized lower-case ("python", "dxf", "ifc", ...)
    engine: ModelEngine
    is_python: bool
    has_code: bool
    file_ids: tuple[str, ...]


def _normalize_model_type(value: str | None) -> str:
    # ``model_type`` defaults to "python" (see DucModelElement.__post_init__) and
    # may arrive upper-cased ("PYTHON", "DXF") from some producers.
    return (value or _PYTHON_MODEL_TYPE).strip().lower()


def _iter_imported_modules_ast(code: str) -> Iterator[str]:
    tree = ast.parse(code)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name
        elif isinstance(node, ast.ImportFrom):
            # Skip relative imports (``from . import x``); they're never an engine.
            if node.module and node.level == 0:
                yield node.module


def _iter_imported_modules_regex(code: str) -> Iterator[str]:
    for from_module, import_part in _IMPORT_RE.findall(code):
        if from_module:
            yield from_module
            continue
        # "import a.b as c, d" -> ["a.b", "d"]
        for chunk in import_part.split(","):
            name = chunk.strip().split(" as ", 1)[0].strip()
            if name:
                yield name


def extract_python_imports(code: str | None) -> set[str]:
    """Return the top-level module names imported by ``code``.

    Uses :mod:`ast` for accuracy and falls back to a line-based regex when the
    source can't be parsed (e.g. an extracted fragment or a syntax error).
    """

    if not code or not code.strip():
        return set()
    try:
        # Materialise inside the try: the generator runs ``ast.parse`` lazily, so
        # a SyntaxError would otherwise escape this handler.
        modules = list(_iter_imported_modules_ast(code))
    except SyntaxError:
        logger.debug("Model code did not parse; falling back to regex import scan")
        modules = list(_iter_imported_modules_regex(code))
    return {module.split(".", 1)[0] for module in modules if module.split(".", 1)[0]}


def _detect_engine_from_imports(modules: Iterable[str]) -> ModelEngine:
    found = {_IMPORT_ENGINES[name] for name in modules if name in _IMPORT_ENGINES}
    for engine in _ENGINE_PRIORITY:
        if engine in found:
            return engine
    return ModelEngine.UNSUPPORTED


def detect_model_engine(element: dict[str, Any]) -> ModelEngine:
    """Classify a parsed model element into a :class:`ModelEngine`."""

    model_type = _normalize_model_type(element.get("model_type"))
    if model_type == _PYTHON_MODEL_TYPE:
        return _detect_engine_from_imports(extract_python_imports(element.get("code")))
    return _MODEL_TYPE_ENGINES.get(model_type, ModelEngine.UNSUPPORTED)


def model_element_info(element: dict[str, Any]) -> ModelElementInfo:
    """Build a :class:`ModelElementInfo` from a parsed model element dict."""

    model_type = _normalize_model_type(element.get("model_type"))
    code = element.get("code")
    file_ids = tuple(str(fid) for fid in (element.get("file_ids") or []) if fid)
    return ModelElementInfo(
        element_id=str(element.get("id") or ""),
        label=str(element.get("label") or ""),
        model_type=model_type,
        engine=detect_model_engine(element),
        is_python=model_type == _PYTHON_MODEL_TYPE,
        has_code=bool(code and str(code).strip()),
        file_ids=file_ids,
    )


def iter_model_elements(duc_data: dict[str, Any]) -> Iterator[dict[str, Any]]:
    """Yield non-deleted model elements from parsed duc data."""

    for element in duc_data.get("elements", []) or []:
        if element.get("is_deleted"):
            continue
        if element.get("type") == MODEL_ELEMENT_TYPE:
            yield element


def resolve_model_search_targets(duc_data: dict[str, Any]) -> list[ModelElementInfo]:
    """Classify every live model element in parsed duc data."""

    return [model_element_info(element) for element in iter_model_elements(duc_data)]


def _model_elements_from_sqlite(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    """Read model elements from a ``.duc`` SQLite database as parsed-style dicts."""

    file_ids_by_element: dict[str, list[str]] = {}
    for row in conn.execute(
        "SELECT element_id, file_id FROM model_element_files ORDER BY element_id, sort_order"
    ):
        if row["file_id"] is not None:
            file_ids_by_element.setdefault(row["element_id"], []).append(str(row["file_id"]))

    elements: list[dict[str, Any]] = []
    for row in conn.execute(
        """
        SELECT
            e.id AS id,
            e.label AS label,
            em.model_type AS model_type,
            em.code AS code
        FROM element_model AS em
        JOIN elements AS e ON e.id = em.element_id
        WHERE e.is_deleted = 0
        """
    ):
        elements.append(
            {
                "id": row["id"],
                "type": MODEL_ELEMENT_TYPE,
                "label": row["label"],
                "model_type": row["model_type"],
                "code": row["code"],
                "file_ids": file_ids_by_element.get(row["id"], []),
            }
        )
    return elements


def _model_content_texts(
    duc_source: str | Path,
    element: dict[str, Any],
    info: ModelElementInfo,
    *,
    run_code: bool,
) -> list[tuple[str, float]]:
    """Return ``(text, source_weight)`` pairs for an element's engine content.

    Ezdxf and IFC content extraction are implemented. Build123d currently
    returns no content text and remains searchable via label/description.
    """

    if info.engine is ModelEngine.EZDXF:
        dxf_text = extract_model_dxf_text(duc_source, element, run_code=run_code)
        return [
            (item.text, _DXF_KIND_WEIGHTS.get(item.kind, 0.8))
            for item in dxf_text.items
            if item.text
        ]
    if info.engine is ModelEngine.IFC:
        ifc_text = extract_model_ifc_text(duc_source, element, run_code=run_code)
        return [
            (item.text, _IFC_KIND_WEIGHTS.get(item.kind, 0.8))
            for item in ifc_text.items
            if item.text
        ]

    return []


def _collect_model_candidates(
    duc_source: str | Path,
    elements: list[dict[str, Any]],
    query: str,
    *,
    run_code: bool,
) -> list[_ElementAggregate]:
    """Score model elements against ``query`` using the shared ranking helpers."""

    # Extract engine content once per element up front — running embedded code is
    # expensive, so it must not happen inside the per-variant loop below.
    content_by_element: dict[str, list[tuple[str, float]]] = {}
    for element in elements:
        element_id = element.get("id")
        if not element_id:
            continue
        info = model_element_info(element)
        content_by_element[element_id] = _model_content_texts(
            duc_source, element, info, run_code=run_code
        )

    aggregates: dict[str, _ElementAggregate] = {}
    for _variant_name, _expression, variant_boost in _build_query_variants(query):
        for element in elements:
            element_id = element.get("id")
            if not element_id:
                continue

            aggregate = aggregates.get(element_id)
            if aggregate is None:
                aggregate = _ElementAggregate(
                    element_id=element_id,
                    raw_element_type=element.get("type") or MODEL_ELEMENT_TYPE,
                    label=element.get("label") or "",
                    description=element.get("description"),
                )
                aggregates[element_id] = aggregate

            scored_texts: list[tuple[str, float]] = [
                (element.get(field_name), weight)
                for field_name, weight in _BASE_FIELD_WEIGHTS.items()
            ]
            scored_texts.extend(content_by_element.get(element_id, []))

            for raw_text, source_weight in scored_texts:
                score, _similarity = _evaluate_match_text(
                    query,
                    raw_text,
                    fts_rank=None,
                    source_weight=source_weight,
                    variant_boost=variant_boost,
                )
                if score > 0.0 and raw_text:
                    for match in _build_match_contexts(query, str(raw_text)):
                        aggregate.add_match(match.text, score, match.pages)

    results = [aggregate for aggregate in aggregates.values() if aggregate.best_score > 0.0]
    results.sort(key=lambda item: (-item.best_score, item.raw_element_type.casefold(), item.element_id))
    return results


def _default_model_output_path(duc_path: Path, query: str) -> Path:
    slug_tokens = _tokenize(query)
    slug = "-".join(slug_tokens[:8]) if slug_tokens else "search"
    return duc_path.with_name(f"{duc_path.stem}.{slug}.model-search-results.json")


def search_duc_models(
    duc_path: str | Path,
    query: str,
    *,
    output_path: str | Path | None = None,
    limit: int = 50,
    run_code: bool = False,
) -> DucSearchResponse:
    """Search the user-authored text inside model elements and rank the results.

    Loads the ``.duc`` (SQLite-backed or native binary), classifies each model
    element, extracts searchable DXF/DWG or IFC content, and scores it against
    ``query`` with the same ranking machinery as :func:`search_duc_elements`.
    Build123d models currently fall back to their label and description.

    ``run_code`` is a trusted-input opt-in. The default (``False``) searches
    linked model files only. Setting it to ``True`` executes embedded Python
    model code in-process to capture generated DXF or IFC content; never enable
    it for untrusted DUC files. Results are written to ``output_path``
    (or a default path beside the ``.duc``) and returned as a
    :class:`DucSearchResponse`.
    """

    duc_file = Path(duc_path)
    if not duc_file.exists():
        raise FileNotFoundError(f"DUC file not found: {duc_file}")
    if limit <= 0:
        raise ValueError("limit must be greater than zero")

    try:
        with DucSQL(duc_file) as db:
            elements = _model_elements_from_sqlite(db.conn)
    except sqlite3.DatabaseError:
        duc_data = parse_duc(str(duc_file))
        elements = list(iter_model_elements(duc_data))

    candidates = _collect_model_candidates(duc_file, elements, query, run_code=run_code)[:limit]
    all_element_ids, results = _build_result_payloads(candidates)

    destination = Path(output_path) if output_path else _default_model_output_path(duc_file, query)
    response = DucSearchResponse(
        query=query,
        results=results,
        total_hits=len(all_element_ids),
        all_element_ids=all_element_ids,
        output_path=str(destination),
    )
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(response.to_dict(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return response
