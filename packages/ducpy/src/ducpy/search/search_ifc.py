"""IFC text extraction for model-element search (the IfcOpenShell engine).

The extractor indexes values that exist in the IFC model itself: human-facing
entity attributes, properties, quantities, materials, classifications,
documents, presentation-layer names, addresses, actors, and selected file-header
metadata. It does not index raw STEP records, IFC entity class names, generated
GlobalIds, or embedded Python source.

Linked IFC files are searched by default. Trusted Python model code can be
executed explicitly to capture IfcOpenShell files it opens or creates.
"""

from __future__ import annotations

import builtins
import contextlib
import io
import logging
import os
import tempfile
from dataclasses import dataclass
from numbers import Number
from pathlib import Path
from typing import Any, Iterator

from ._model_files import external_file_bytes

logger = logging.getLogger(__name__)

__all__ = [
    "IfcText",
    "IfcTextItem",
    "extract_ifc_file_text",
    "extract_ifc_text",
    "extract_model_ifc_text",
    "ifcopenshell_available",
]

_SKIPPED_ATTRIBUTES = {"GlobalId", "OwnerHistory"}
_NON_TEXT_ATTRIBUTE_TYPES = ("BINARY", "BOOLEAN", "ENUMERATION", "LOGICAL")


@dataclass(frozen=True, slots=True)
class IfcTextItem:
    """A searchable value read from a specific IFC entity attribute."""

    text: str
    kind: str
    entity_type: str | None = None
    entity_id: int | None = None
    field: str | None = None


@dataclass(frozen=True, slots=True)
class IfcText:
    """Result of extracting user-facing text from one or more IFC files."""

    items: tuple[IfcTextItem, ...] = ()

    @property
    def text(self) -> str:
        return "\n".join(item.text for item in self.items)

    def texts_by_kind(self, kind: str) -> list[str]:
        return [item.text for item in self.items if item.kind == kind]


def ifcopenshell_available() -> bool:
    """Return whether IfcOpenShell can be imported."""

    try:
        import ifcopenshell  # noqa: F401
    except Exception as exc:  # pragma: no cover - environment dependent
        logger.debug("IfcOpenShell is unavailable: %s", exc)
        return False
    return True


def _clean(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).split())


def _dedupe(items: list[IfcTextItem]) -> tuple[IfcTextItem, ...]:
    seen: set[tuple[str, str, str | None, int | None, str | None]] = set()
    ordered: list[IfcTextItem] = []
    for item in items:
        if not item.text:
            continue
        key = (item.kind, item.text, item.entity_type, item.entity_id, item.field)
        if key in seen:
            continue
        seen.add(key)
        ordered.append(item)
    return tuple(ordered)


def _entity_kind(entity_type: str) -> str:
    if entity_type.startswith("IfcProperty"):
        return "property"
    if entity_type.startswith("IfcQuantity") or entity_type == "IfcPhysicalComplexQuantity":
        return "quantity"
    if entity_type.startswith("IfcMaterial"):
        return "material"
    if entity_type.startswith("IfcClassification"):
        return "classification"
    if entity_type.startswith("IfcDocument"):
        return "document"
    if entity_type in {"IfcPerson", "IfcOrganization", "IfcPersonAndOrganization"}:
        return "actor"
    if entity_type.endswith("Address"):
        return "address"
    if entity_type == "IfcPresentationLayerAssignment":
        return "presentation_layer"
    return "attribute"


def _iter_scalar_values(value: Any, *, allow_numeric: bool) -> Iterator[str]:
    if value is None:
        return
    if isinstance(value, str):
        cleaned = _clean(value)
        if cleaned:
            yield cleaned
        return

    wrapped = getattr(value, "wrappedValue", None)
    if wrapped is not None:
        yield from _iter_scalar_values(wrapped, allow_numeric=allow_numeric)
        return

    if isinstance(value, (tuple, list, set, frozenset)):
        for item in value:
            yield from _iter_scalar_values(item, allow_numeric=allow_numeric)
        return

    # Numbers are indexed only for IFC properties and quantities, never geometry.
    if allow_numeric and isinstance(value, (Number, bool)):
        yield _clean(value)


def _iter_entity_text(entity: Any) -> Iterator[IfcTextItem]:
    try:
        entity_type = str(entity.is_a())
        entity_id = int(entity.id()) or None
        attribute_count = len(entity)
    except Exception:
        return

    kind = _entity_kind(entity_type)
    allow_numeric = kind in {"property", "quantity"}

    for index in range(attribute_count):
        try:
            field = str(entity.attribute_name(index))
            attribute_type = str(entity.attribute_type(index)).upper()
            value = entity[index]
        except Exception:
            continue

        if field in _SKIPPED_ATTRIBUTES:
            continue
        if any(marker in attribute_type for marker in _NON_TEXT_ATTRIBUTE_TYPES):
            continue

        for text in _iter_scalar_values(value, allow_numeric=allow_numeric):
            yield IfcTextItem(
                text=text,
                kind=kind,
                entity_type=entity_type,
                entity_id=entity_id,
                field=field,
            )


def _iter_header_text(model: Any) -> Iterator[IfcTextItem]:
    """Yield human-entered STEP header fields, excluding schema/version data."""

    try:
        file_name = model.header.file_name
    except Exception:
        return

    for field in ("name", "author", "organization", "authorization"):
        try:
            value = getattr(file_name, field)
        except Exception:
            continue
        for text in _iter_scalar_values(value, allow_numeric=False):
            yield IfcTextItem(text=text, kind="header", field=field)


def extract_ifc_file_text(model: Any) -> IfcText:
    """Extract searchable values from a loaded IfcOpenShell file."""

    items = list(_iter_header_text(model))
    try:
        entities = iter(model)
    except Exception as exc:
        logger.debug("Object is not an iterable IFC file: %s", exc)
        return IfcText(_dedupe(items))

    for entity in entities:
        try:
            items.extend(_iter_entity_text(entity))
        except Exception as exc:
            logger.debug("Could not inspect IFC entity for search: %s", exc)
    return IfcText(_dedupe(items))


def _decode_ifc_bytes(ifc_bytes: bytes) -> str:
    try:
        return ifc_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        return ifc_bytes.decode("latin-1")


def extract_ifc_text(ifc_bytes: bytes) -> IfcText:
    """Parse IFC STEP bytes and extract searchable values, or return empty."""

    if not ifc_bytes or not ifcopenshell_available():
        return IfcText()
    prefix = ifc_bytes[:128].lstrip(b"\xef\xbb\xbf \t\r\n").upper()
    if not prefix.startswith(b"ISO-10303-21;"):
        return IfcText()


    try:
        import ifcopenshell

        model = ifcopenshell.file.from_string(_decode_ifc_bytes(ifc_bytes))
    except Exception as exc:
        logger.debug("Failed to load IFC for search: %s", exc)
        return IfcText()
    return extract_ifc_file_text(model)


def _capture_ifc_values(
    value: Any,
    ifcopenshell_module: Any,
    captured: list[Any],
    seen: set[int],
    *,
    depth: int = 0,
) -> None:
    if depth > 3:
        return

    identity = id(value)
    if identity in seen:
        return
    seen.add(identity)

    try:
        if isinstance(value, ifcopenshell_module.file):
            captured.append(value)
            return
    except Exception:
        pass

    if isinstance(value, dict):
        nested_values = value.values()
    elif isinstance(value, (tuple, list, set, frozenset)):
        nested_values = value
    else:
        return

    for nested in nested_values:
        _capture_ifc_values(
            nested,
            ifcopenshell_module,
            captured,
            seen,
            depth=depth + 1,
        )


def _run_and_capture_ifc_files(
    code: str,
    duc_source: str | Path,
    file_ids: list[str],
) -> list[Any]:
    """Execute trusted embedded Python and capture opened/created IFC files."""

    import ifcopenshell

    captured: list[Any] = []

    with tempfile.TemporaryDirectory(prefix="ducpy-ifc-") as tmpdir:
        resolved: dict[str, str] = {}
        for file_id in file_ids:
            blob = external_file_bytes(duc_source, file_id)
            if blob is None:
                continue
            target = Path(tmpdir) / f"{file_id}.ifc"
            target.write_bytes(blob)
            resolved[file_id] = str(target)

        def resolve_external_file(file_id: str) -> str:
            key = str(file_id)
            if key in resolved:
                return resolved[key]
            raise FileNotFoundError(f"External file '{key}' not found for model search.")

        original_open = ifcopenshell.open
        original_file_init = ifcopenshell.file.__init__

        def init_and_record(model: Any, *args: Any, **kwargs: Any) -> None:
            original_file_init(model, *args, **kwargs)
            captured.append(model)


        def open_and_record(*args: Any, **kwargs: Any) -> Any:
            model = original_open(*args, **kwargs)
            captured.append(model)
            return model

        previous_resolverr = getattr(builtins, "resolve_external_file", None)
        had_resolver = hasattr(builtins, "resolve_external_file")
        previous_cwd = os.getcwd()
        globals_dict: dict[str, Any] = {
            "__name__": "__main__",
            "external_files": {
                file_id: {"id": file_id, "path": path}
                for file_id, path in resolved.items()
            },
            "resolve_external_file": resolve_external_file,
        }

        try:
            ifcopenshell.open = open_and_record
            ifcopenshell.file.__init__ = init_and_record
            builtins.resolve_external_file = resolve_external_file
            os.chdir(tmpdir)
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                exec(compile(code, "<ducpy-ifc-model>", "exec"), globals_dict)
        except Exception as exc:
            logger.debug("Embedded IfcOpenShell code did not run cleanly: %s", exc)
        finally:
            seen: set[int] = set()
            for value in globals_dict.values():
                _capture_ifc_values(value, ifcopenshell, captured, seen)
            os.chdir(previous_cwd)
            ifcopenshell.open = original_open
            ifcopenshell.file.__init__ = original_file_init
            if had_resolver:
                builtins.resolve_external_file = previous_resolver
            elif hasattr(builtins, "resolve_external_file"):
                delattr(builtins, "resolve_external_file")

    unique: list[Any] = []
    seen_models: set[int] = set()
    for model in captured:
        if id(model) in seen_models:
            continue
        seen_models.add(id(model))
        unique.append(model)
    return unique


def extract_model_ifc_text(
    duc_source: str | Path,
    element: dict[str, Any],
    *,
    run_code: bool = False,
) -> IfcText:
    """Extract searchable values from a DUC IFC model element.

    Linked files are read without code execution. Enabling run_code executes
    trusted Python/IfcOpenShell code in-process and indexes only values that are
    materialized into captured IFC entities. Python source itself is not searched.
    """

    if not ifcopenshell_available():
        logger.debug("IfcOpenShell unavailable; cannot extract model IFC text")
        return IfcText()

    model_type = (element.get("model_type") or "python").strip().lower()
    code = element.get("code")
    file_ids = [str(fid) for fid in (element.get("file_ids") or []) if fid]

    if (
        run_code
        and model_type == "python"
        and isinstance(code, str)
        and "ifcopenshell" in code
    ):
        items: list[IfcTextItem] = []
        for model in _run_and_capture_ifc_files(code, duc_source, file_ids):
            items.extend(extract_ifc_file_text(model).items)
        if items:
            return IfcText(_dedupe(items))
        logger.debug("Code execution captured no IFC files; falling back to external files")

    items: list[IfcTextItem] = []
    for file_id in file_ids:
        blob = external_file_bytes(duc_source, file_id)
        if not blob:
            continue
        items.extend(extract_ifc_text(blob).items)
    return IfcText(_dedupe(items))
