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

This module currently only *detects* the engine for each model element and
reports what would be searched; the actual per-engine text/geometry extraction
will be layered on later.
"""

from __future__ import annotations

import ast
import logging
import re
import sqlite3
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Iterable, Iterator

from ..builders.sql_builder import DucSQL
from ..parse import parse_duc_lazy

logger = logging.getLogger(__name__)

__all__ = [
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

_ENGINE_MESSAGES: dict[ModelEngine, str] = {
    ModelEngine.EZDXF: "Searching ezdxf model",
    ModelEngine.IFC: "Searching IFC model",
    ModelEngine.BUILD123D: "Searching build123d model",
    ModelEngine.UNSUPPORTED: "Unsupported model — skipping",
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


def _report_targets(targets: list[ModelElementInfo], query: str) -> None:
    for info in targets:
        label = info.label or info.element_id or "<unnamed>"
        source = "python code" if info.is_python else f"{info.model_type} file"
        message = _ENGINE_MESSAGES[info.engine]
        if info.engine is ModelEngine.UNSUPPORTED:
            print(f"{message}: '{label}' (model_type={info.model_type}, source={source})")
        else:
            print(f"{message}: '{label}' (source={source}) — query={query!r}")


def search_duc_models(
    duc_path: str | Path,
    query: str,
    *,
    limit: int = 50,
) -> list[ModelElementInfo]:
    """Detect the engine behind every model element in a ``.duc`` file.

    This is the scaffolding step: it loads the ``.duc`` (SQLite-backed or native
    binary), classifies each model element (ezdxf / IFC / build123d /
    unsupported) and reports what *would* be searched. Actual per-engine content
    search is not implemented yet.

    Returns the list of :class:`ModelElementInfo` classifications.
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
        duc_data = parse_duc_lazy(str(duc_file))
        elements = list(iter_model_elements(duc_data))

    targets = [model_element_info(element) for element in elements][:limit]
    _report_targets(targets, query)
    return targets
