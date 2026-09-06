"""Semantic text extraction for build123d model elements.

Only metadata materialized into a CAD model is indexed: shape/assembly labels,
materials, joints, viewer names, STEP product metadata, and ASCII STL solid
names. Python source, raw STEP syntax, geometry, coordinates, and binary STL
headers are deliberately excluded.
"""

from __future__ import annotations

import builtins
import contextlib
import io
import logging
import os
import re
import struct
import tempfile
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator, Sequence

from ._model_files import stream_active_external_file_to_path

logger = logging.getLogger(__name__)

__all__ = [
    "Build123dText",
    "Build123dTextItem",
    "build123d_available",
    "extract_build123d_path_text",
    "extract_build123d_shape_text",
    "extract_build123d_text",
    "extract_model_build123d_text",
]

_EXECUTION_LOCK = threading.RLock()
_MAX_GRAPH_DEPTH = 64
_MAX_GRAPH_NODES = 10_000
_MAX_CAPTURED_SHAPES = 10_000
_MAX_ITEMS = 2_000
_MAX_TEXT_LENGTH = 512
_MAX_STL_NAME_LENGTH = 256

_GENERIC_VALUES = {
    "",
    "NONE",
    "NULL",
    "UNKNOWN",
    "UNSPECIFIED",
    "UNDEFINED",
    "DEFAULT",
    "SHAPE",
    "SOLID",
    "COMPOUND",
    "PART",
    "ASSEMBLY",
    "PRODUCT",
    "VERSION",
}


@dataclass(frozen=True, slots=True)
class Build123dTextItem:
    """One semantic text value extracted from a build123d-backed model."""

    text: str
    kind: str
    owner: str | None = None
    field: str | None = None


@dataclass(frozen=True, slots=True)
class Build123dText:
    """Searchable text extracted from one or more build123d-backed models."""

    items: tuple[Build123dTextItem, ...] = ()

    @property
    def text(self) -> str:
        return "\n".join(item.text for item in self.items)

    def texts_by_kind(self, kind: str) -> list[str]:
        return [item.text for item in self.items if item.kind == kind]


def build123d_available() -> bool:
    """Return whether build123d can be imported."""

    try:
        import build123d  # noqa: F401
    except Exception as exc:  # pragma: no cover - environment dependent
        logger.debug("build123d is unavailable: %s", exc)
        return False
    return True


def _clean(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    cleaned = " ".join(value.split())
    if not cleaned or len(cleaned) > _MAX_TEXT_LENGTH:
        return ""
    if any(ord(char) < 32 for char in cleaned):
        return ""
    return cleaned


def _is_meaningful(value: str, *, reject_generic: bool = False) -> bool:
    if not value:
        return False
    folded = value.casefold()
    if reject_generic and value.upper() in _GENERIC_VALUES:
        return False
    if folded in {item.casefold() for item in _GENERIC_VALUES}:
        return False
    if value.isdecimal():
        return False
    if re.fullmatch(r"[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}", value):
        return False
    return True


def _dedupe(items: Sequence[Build123dTextItem]) -> tuple[Build123dTextItem, ...]:
    seen: set[tuple[str, str, str | None, str | None]] = set()
    result: list[Build123dTextItem] = []
    for item in items:
        text = _clean(item.text)
        if not text:
            continue
        key = (item.kind, text.casefold(), item.owner, item.field)
        if key in seen:
            continue
        seen.add(key)
        result.append(Build123dTextItem(text, item.kind, item.owner, item.field))
        if len(result) >= _MAX_ITEMS:
            break
    return tuple(result)


def _iter_shape_text(
    roots: Sequence[Any],
    *,
    max_depth: int = _MAX_GRAPH_DEPTH,
    max_nodes: int = _MAX_GRAPH_NODES,
) -> Iterator[Build123dTextItem]:
    """Walk only build123d's explicit ``children`` assembly relationship."""

    try:
        from build123d import Shape
    except Exception:
        return

    visited: set[int] = set()
    stack: list[tuple[Any, int]] = [(root, 0) for root in reversed(list(roots))]
    while stack and len(visited) < max_nodes:
        shape, depth = stack.pop()
        if not isinstance(shape, Shape):
            continue
        identity = id(shape)
        if identity in visited:
            continue
        visited.add(identity)

        label = _clean(getattr(shape, "label", ""))
        owner = label or None
        if _is_meaningful(label):
            yield Build123dTextItem(label, "label", owner=owner, field="label")

        material = _clean(getattr(shape, "material", ""))
        if _is_meaningful(material):
            yield Build123dTextItem(material, "material", owner=owner, field="material")

        joints = getattr(shape, "joints", None)
        if isinstance(joints, dict):
            for joint_key, joint in joints.items():
                key_text = _clean(joint_key)
                if _is_meaningful(key_text):
                    yield Build123dTextItem(key_text, "joint", owner=owner, field="key")
                joint_label = _clean(getattr(joint, "label", ""))
                if _is_meaningful(joint_label) and joint_label.casefold() != key_text.casefold():
                    yield Build123dTextItem(
                        joint_label, "joint", owner=owner, field="label"
                    )

        if depth >= max_depth:
            continue
        children = getattr(shape, "children", None)
        if isinstance(children, (list, tuple)):
            for child in reversed(children):
                stack.append((child, depth + 1))


def extract_build123d_shape_text(
    shape: Any | Sequence[Any],
    *,
    viewer_names: Sequence[str] = (),
) -> Build123dText:
    """Extract labels/materials/joints from loaded shapes and viewer names."""

    roots = list(shape) if isinstance(shape, (list, tuple)) else [shape]
    items = list(_iter_shape_text(roots))
    for name in viewer_names:
        text = _clean(name)
        if _is_meaningful(text):
            items.append(Build123dTextItem(text, "viewer_name", field="names"))
    return Build123dText(_dedupe(items))


def _step_entity_spec(entity_type: str) -> tuple[str, tuple[str, ...]] | None:
    """Map an exact semantic STEP entity family to approved scalar fields."""

    if entity_type == "StepBasic_Product":
        return "step_product_name", ("Name", "Description")
    if entity_type.startswith("StepBasic_ProductDefinition"):
        return "step_product_description", ("Description",)
    if entity_type == "StepBasic_ProductRelatedProductCategory":
        return "step_classification", ("Name", "Description")
    if entity_type == "StepRepr_ProductDefinitionShape":
        return "step_product_description", ("Name", "Description")
    if entity_type.startswith("StepBasic_Document"):
        return "step_document", ("Name", "Description", "Kind", "Purpose")
    if "Material" in entity_type:
        return "step_material", ("Name", "Description")
    if "Classification" in entity_type:
        return "step_classification", ("Name", "Description", "Purpose")
    if entity_type == "StepBasic_Organization":
        return "step_party", ("Name", "Description")
    if entity_type == "StepBasic_Person":
        return "step_party", ("GivenName", "Surname")
    if entity_type.endswith("Role"):
        return "step_role", ("Name",)
    return None


def _ocp_scalar(value: Any) -> str:
    if value is None:
        return ""
    for method_name in ("ToCString", "ToExtString"):
        method = getattr(value, method_name, None)
        if callable(method):
            try:
                return _clean(str(method()))
            except Exception:
                return ""
    return _clean(value if isinstance(value, str) else "")


def _iter_step_semantic_text(path: str | Path) -> Iterator[Build123dTextItem]:
    """Read approved STEP entity fields through Open Cascade, never source text."""

    try:
        from OCP.IFSelect import IFSelect_ReturnStatus
        from OCP.STEPControl import STEPControl_Reader

        reader = STEPControl_Reader()
        if reader.ReadFile(os.fspath(path)) != IFSelect_ReturnStatus.IFSelect_RetDone:
            return
        model = reader.StepModel()
    except Exception as exc:
        logger.debug("Could not open STEP metadata for search: %s", exc)
        return

    yielded = 0
    for index in range(1, model.NbEntities() + 1):
        if yielded >= _MAX_ITEMS:
            break
        try:
            entity = model.Value(index)
            entity_type = type(entity).__name__
        except Exception:
            continue
        spec = _step_entity_spec(entity_type)
        if spec is None:
            continue
        kind, fields = spec
        for field in fields:
            getter = getattr(entity, field, None)
            if not callable(getter):
                continue
            try:
                text = _ocp_scalar(getter())
            except Exception:
                continue
            if not _is_meaningful(text, reject_generic=True):
                continue
            yield Build123dTextItem(text, kind, owner=entity_type, field=field)
            yielded += 1


def _extract_step_path_text(path: str | Path) -> Build123dText:
    try:
        from build123d import import_step

        shape = import_step(path)
    except Exception as exc:
        logger.debug("Failed to import STEP for search: %s", exc)
        return Build123dText()

    items: list[Build123dTextItem] = []
    for item in extract_build123d_shape_text(shape).items:
        text = item.text.replace("_", " ") if item.kind == "label" else item.text
        if item.kind == "label" and not _is_meaningful(text, reject_generic=True):
            continue
        kind = "step_label" if item.kind == "label" else item.kind
        items.append(Build123dTextItem(text, kind, item.owner, item.field))
    items.extend(_iter_step_semantic_text(path))
    return Build123dText(_dedupe(items))


def _is_binary_stl(path: str | Path) -> bool:
    try:
        size = Path(path).stat().st_size
        if size < 84:
            return False
        with Path(path).open("rb") as source:
            header = source.read(84)
        triangle_count = struct.unpack_from("<I", header, 80)[0]
        return triangle_count <= (size - 84) // 50 and 84 + 50 * triangle_count == size
    except (OSError, struct.error):
        return False


def _ascii_stl_name(path: str | Path) -> str:
    if _is_binary_stl(path):
        return ""
    try:
        file_path = Path(path)
        size = file_path.stat().st_size
        with file_path.open("rb") as source:
            opening = source.read(min(size, 4096))
            source.seek(max(0, size - 4096))
            ending = source.read(4096)
        opening_text = opening.decode("utf-8-sig", errors="strict")
        ending_text = ending.decode("utf-8", errors="strict")
    except (OSError, UnicodeDecodeError):
        return ""

    match = re.match(r"^\s*solid(?:[ \t]+([^\r\n]*))?\s*(?:\r?\n|$)", opening_text, re.I)
    if match is None or "facet" not in opening_text.casefold():
        return ""
    if re.search(r"(?:^|\r?\n)\s*endsolid(?:[ \t]+[^\r\n]*)?\s*$", ending_text, re.I) is None:
        return ""
    name = _clean(match.group(1) or "")
    if len(name) > _MAX_STL_NAME_LENGTH:
        return ""
    return name if _is_meaningful(name, reject_generic=True) else ""


def _extract_stl_path_text(path: str | Path) -> Build123dText:
    try:
        from build123d import import_stl

        import_stl(path)
    except Exception as exc:
        logger.debug("Failed to import STL for search: %s", exc)
        return Build123dText()
    name = _ascii_stl_name(path)
    if not name:
        return Build123dText()
    return Build123dText((Build123dTextItem(name, "stl_solid", field="solid"),))


def extract_build123d_path_text(
    path: str | Path,
    model_type: str | None = None,
) -> Build123dText:
    """Extract semantic text from a STEP/STP or STL path."""

    if not build123d_available():
        return Build123dText()
    normalized_type = (model_type or Path(path).suffix.lstrip(".")).strip().lower()
    if normalized_type in {"step", "stp"}:
        return _extract_step_path_text(path)
    if normalized_type == "stl":
        return _extract_stl_path_text(path)
    try:
        with Path(path).open("rb") as source:
            prefix = source.read(128).lstrip(b"\xef\xbb\xbf \t\r\n").upper()
    except OSError:
        return Build123dText()
    if prefix.startswith(b"ISO-10303-21;"):
        return _extract_step_path_text(path)
    return _extract_stl_path_text(path)


def extract_build123d_text(data: bytes, model_type: str) -> Build123dText:
    """Extract semantic build123d-backed text from in-memory file data."""

    if not data:
        return Build123dText()
    suffix = ".step" if model_type.lower() in {"step", "stp"} else ".stl"
    with tempfile.NamedTemporaryFile(prefix="ducpy-build123d-", suffix=suffix) as target:
        target.write(data)
        target.flush()
        return extract_build123d_path_text(target.name, model_type)


def _capture_shape_values(
    value: Any,
    shape_type: type[Any],
    captured: list[Any],
    seen: set[int],
    *,
    depth: int = 0,
) -> None:
    if depth > 4 or len(captured) >= _MAX_CAPTURED_SHAPES:
        return
    identity = id(value)
    if identity in seen:
        return
    seen.add(identity)
    if isinstance(value, shape_type):
        captured.append(value)
        return
    if isinstance(value, dict):
        values = value.values()
    elif isinstance(value, (list, tuple, set, frozenset)):
        values = value
    else:
        return
    for nested in values:
        _capture_shape_values(nested, shape_type, captured, seen, depth=depth + 1)


def _viewer_names(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, (list, tuple)):
        return [item for item in value if isinstance(item, str)]
    return []


def _run_and_capture_build123d(
    code: str,
    duc_source: str | Path,
    file_ids: list[str],
    model_type: str,
) -> tuple[list[Any], list[str]]:
    """Execute trusted Python while capturing build123d model metadata roots."""

    import build123d
    from build123d import Shape

    captured: list[Any] = []
    names: list[str] = []
    suffix = ".stl" if model_type == "stl" else ".step"

    with _EXECUTION_LOCK, tempfile.TemporaryDirectory(prefix="ducpy-build123d-") as tmpdir:
        resolved: dict[str, str] = {}
        for index, file_id in enumerate(file_ids):
            target = Path(tmpdir) / f"model-file-{index}{suffix}"
            if stream_active_external_file_to_path(duc_source, file_id, target) > 0:
                resolved[file_id] = str(target)

        def resolve_external_file(file_id: str) -> str:
            key = str(file_id)
            if key in resolved:
                return resolved[key]
            raise FileNotFoundError(f"External file '{key}' not found for model search.")

        original_shape_init = Shape.__init__
        seen_viewer_values: set[int] = set()

        def init_and_capture(shape: Any, *args: Any, **kwargs: Any) -> None:
            original_shape_init(shape, *args, **kwargs)
            if len(captured) < _MAX_CAPTURED_SHAPES:
                captured.append(shape)

        viewer_module = None
        viewer_originals: dict[str, Any] = {}
        try:
            import ocp_vscode as viewer_module  # type: ignore[no-redef]
        except Exception:
            viewer_module = None

        def viewer_capture(*args: Any, **kwargs: Any) -> None:
            before = len(captured)
            for value in args:
                _capture_shape_values(value, Shape, captured, seen_viewer_values)
            if len(captured) > before:
                names.extend(_viewer_names(kwargs.get("names")))

        previous_resolver = getattr(builtins, "resolve_external_file", None)
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
            Shape.__init__ = init_and_capture
            if viewer_module is not None:
                for function_name in ("show", "show_object", "show_all"):
                    original = getattr(viewer_module, function_name, None)
                    if callable(original):
                        viewer_originals[function_name] = original
                        setattr(viewer_module, function_name, viewer_capture)
            builtins.resolve_external_file = resolve_external_file
            os.chdir(tmpdir)
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                exec(compile(code, "<ducpy-build123d-model>", "exec"), globals_dict)
        except Exception as exc:
            logger.debug("Embedded build123d code did not run cleanly: %s", exc)
        finally:
            seen_globals: set[int] = set()
            for value in globals_dict.values():
                _capture_shape_values(value, Shape, captured, seen_globals)
            os.chdir(previous_cwd)
            Shape.__init__ = original_shape_init
            if viewer_module is not None:
                for function_name, original in viewer_originals.items():
                    setattr(viewer_module, function_name, original)
            if had_resolver:
                builtins.resolve_external_file = previous_resolver
            elif hasattr(builtins, "resolve_external_file"):
                delattr(builtins, "resolve_external_file")

    unique: list[Any] = []
    seen_shapes: set[int] = set()
    for shape in captured:
        if id(shape) in seen_shapes:
            continue
        seen_shapes.add(id(shape))
        unique.append(shape)
    return unique, names


def extract_model_build123d_text(
    duc_source: str | Path,
    element: dict[str, Any],
    *,
    run_code: bool = False,
) -> Build123dText:
    """Extract semantic text from a DUC build123d model element.

    ``run_code=True`` executes arbitrary embedded Python in-process and must only
    be used for trusted DUC files. Source code and execution output are never
    indexed.
    """

    if not build123d_available():
        return Build123dText()
    model_type = (element.get("model_type") or "python").strip().lower()
    code = element.get("code")
    file_ids = [str(file_id) for file_id in (element.get("file_ids") or []) if file_id]

    if run_code and model_type == "python" and isinstance(code, str) and "build123d" in code:
        shapes, names = _run_and_capture_build123d(code, duc_source, file_ids, model_type)
        result = extract_build123d_shape_text(shapes, viewer_names=names)
        if result.items:
            return result
        logger.debug("Code execution captured no searchable build123d metadata")

    items: list[Build123dTextItem] = []
    with tempfile.TemporaryDirectory(prefix="ducpy-build123d-") as tmpdir:
        for index, file_id in enumerate(file_ids):
            suffix = ".stl" if model_type == "stl" else ".step"
            target = Path(tmpdir) / f"model-file-{index}{suffix}"
            if stream_active_external_file_to_path(duc_source, file_id, target) <= 0:
                continue
            effective_type = model_type if model_type != "python" else None
            items.extend(extract_build123d_path_text(target, effective_type).items)
    return Build123dText(_dedupe(items))
