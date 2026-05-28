"""
Serialize DUC data using the Rust native extension (ducpy_native).
"""

from __future__ import annotations

import logging
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import ducpy_native
from ducpy.utils.convert import (deep_snake_to_camel, snake_to_camel,
                                 to_serializable)

logger = logging.getLogger(__name__)


class DucSerializationValidationError(ValueError):
    """Raised when embedded element code fails validation before serialization."""

    def __init__(self, failures: List[str]):
        self.failures = failures
        super().__init__("Embedded code validation failed:\n" + "\n".join(f"- {failure}" for failure in failures))


def _find_schema_file() -> Path | None:
    env_path = Path(os.environ["DUC_SCHEMA_DIR"]) if "DUC_SCHEMA_DIR" in os.environ else None
    if env_path is not None:
        candidate = env_path / "duc.sql"
        if candidate.exists():
            return candidate

    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "schema" / "duc.sql"
        if candidate.exists():
            return candidate

    return None


def _decode_user_version_to_semver(user_version: int) -> str:
    """Decode sqlite-style schema user_version to semver.

    Encoding convention:
        major * 1_000_000 + minor * 1_000 + patch
    """
    if user_version < 0:
        return "0.0.0"

    major = user_version // 1_000_000
    minor = (user_version % 1_000_000) // 1_000
    patch = user_version % 1_000
    return f"{major}.{minor}.{patch}"


def _read_schema_version_fallback() -> str:
    """Resolve schema version directly from repository `schema/duc.sql`.

    This is used when `ducpy._version` isn't available (for example, in clean
    CI environments before setup-time generation has run).
    """
    try:
        schema_path = _find_schema_file()
        if schema_path is None:
            return "0.0.0"
        content = schema_path.read_text(encoding="utf-8")
        match = re.search(r"PRAGMA\s+user_version\s*=\s*(\d+)\s*;", content)
        if match:
            return _decode_user_version_to_semver(int(match.group(1)))
    except Exception as exc:  # pragma: no cover - defensive fallback for CI/runtime variance
        logger.warning("Failed to resolve schema version fallback from duc.sql: %s", exc)

    return "0.0.0"


try:
    from ducpy._version import DUC_SCHEMA_VERSION
except ModuleNotFoundError:
    DUC_SCHEMA_VERSION = _read_schema_version_fallback()

# Map Python element class names → Rust serde type tag strings.
_ELEMENT_CLASS_TO_TYPE: Dict[str, str] = {
    "DucRectangleElement": "rectangle",
    "DucPolygonElement": "polygon",
    "DucEllipseElement": "ellipse",
    "DucEmbeddableElement": "embeddable",
    "DucPdfElement": "pdf",
    "DucTableElement": "table",
    "DucImageElement": "image",
    "DucTextElement": "text",
    "DucLinearElement": "line",
    "DucArrowElement": "arrow",
    "DucFreeDrawElement": "freedraw",
    "DucFrameElement": "frame",
    "DucPlotElement": "plot",
    "DucDocElement": "doc",
    "DucModelElement": "model",
}

# Keys in the asdict() output that should be flattened (merged into the parent),
# mirroring Rust's #[serde(flatten)] on base / styles / linear_base / stack_element_base.
_FLATTEN_KEYS = frozenset({"base", "styles", "linear_base", "stack_element_base"})


def _flatten_dict(d: dict) -> dict:
    """Recursively flatten nested dicts whose key is in ``_FLATTEN_KEYS``."""
    result: dict = {}
    for k, v in d.items():
        if k in _FLATTEN_KEYS and isinstance(v, dict):
            result.update(_flatten_dict(v))
        else:
            result[k] = v
    return result


def _element_to_camel(wrapper_or_element: Any) -> dict:
    """Convert an element (or ElementWrapper) to the camelCase dict Rust expects."""
    el = wrapper_or_element
    # Unwrap ElementWrapper transparently
    if is_dataclass(el) and hasattr(el, "element"):
        el = el.element

    if isinstance(el, dict):
        d = dict(el)
    elif is_dataclass(el):
        class_name = type(el).__name__
        d = asdict(el)
        # Inject the type tag if we know the mapping
        type_tag = _ELEMENT_CLASS_TO_TYPE.get(class_name)
        if type_tag:
            d["type"] = type_tag
    else:
        return el

    d = _flatten_dict(d)
    return deep_snake_to_camel(d)


def _convert_external_files(
    entries: Optional[Any],
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, bytes]]]:
    """Convert DucExternalFile dict (or legacy list) to camelCase dicts for serialization.

    Returns ``(files_meta, files_data)`` where *files_meta* contains revision
    metadata (no blobs) and *files_data* maps revision-id → raw bytes for the
    separate ``filesData`` key expected by the Rust serializer.
    """
    if not entries:
        return None, None

    data_blobs: Dict[str, bytes] = {}

    def _extract_blobs(entry: Any) -> None:
        blobs = getattr(entry, "_data_blobs", None)
        if blobs:
            data_blobs.update(blobs)

    # New format: already a dict mapping id → DucExternalFile
    if isinstance(entries, dict):
        result: dict = {}
        for key, value in entries.items():
            _extract_blobs(value)
            if is_dataclass(value):
                value = asdict(value)
            result[key] = deep_snake_to_camel(value) if isinstance(value, dict) else value
        return (result if result else None), (data_blobs if data_blobs else None)

    # Legacy list format: list of DucExternalFileEntry { key, value }
    result = {}
    for entry in entries:
        _extract_blobs(entry)
        if is_dataclass(entry):
            entry = asdict(entry)
        if isinstance(entry, dict):
            key = entry.get("key", entry.get("id", ""))
            value = entry.get("value", entry)
            if is_dataclass(value):
                value = asdict(value)
            result[key] = deep_snake_to_camel(value) if isinstance(value, dict) else value
    return (result if result else None), (data_blobs if data_blobs else None)


def _convert_dict_entries(
    entries: Optional[list],
) -> Optional[Dict[str, str]]:
    """Convert a list of DictionaryEntry to a ``{key: value}`` dict."""
    if not entries:
        return None
    if isinstance(entries, dict):
        return entries
    result: dict = {}
    for entry in entries:
        if is_dataclass(entry):
            entry = asdict(entry)
        if isinstance(entry, dict):
            result[entry.get("key", "")] = entry.get("value", "")
    return result if result else None


def _convert_list(items: Optional[list]) -> Optional[list]:
    """Convert a list of dataclass instances to camelCase dicts."""
    if not items:
        return None
    return [to_serializable(item) for item in items]


def _element_label(element: Dict[str, Any]) -> str:
    element_id = element.get("id") or element.get("elementId") or "unknown"
    element_type = element.get("type") or "element"
    return f"{element_type} {element_id}"


def _run_python_validation(code: str, label: str, timeout_seconds: float) -> Optional[str]:
    with tempfile.TemporaryDirectory(prefix="ducpy-model-") as tmpdir:
        script_path = Path(tmpdir) / "model.py"
        script_path.write_text(code, encoding="utf-8")

        try:
            completed = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=tmpdir,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout_seconds,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            return f"{label}: Python validation timed out after {timeout_seconds:g}s"
        except OSError as exc:
            return f"{label}: failed to start Python validation: {exc}"

    if completed.returncode == 0:
        return None

    output = (completed.stderr or completed.stdout or "Python process exited with an error").strip()
    return f"{label}: Python validation failed\n{output}"


def _write_typst_external_files(project_dir: Path, files_meta: Optional[Dict[str, Any]], files_data: Optional[Dict[str, bytes]]) -> None:
    if not files_meta or not files_data:
        return

    for file_id, meta in files_meta.items():
        if not isinstance(meta, dict):
            continue

        active_revision_id = meta.get("activeRevisionId") or meta.get("active_revision_id")
        revisions = meta.get("revisions") or {}
        revision = revisions.get(active_revision_id) if isinstance(revisions, dict) else None
        if not active_revision_id or not isinstance(revision, dict):
            continue

        data = files_data.get(active_revision_id)
        if data is None:
            continue

        source_name = revision.get("sourceName") or revision.get("source_name") or "file"
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", str(source_name).strip() or "file")
        target = project_dir / "scopture-files" / str(file_id) / safe_name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(bytes(data))


def _run_typst_validation(
    code: str,
    label: str,
    timeout_seconds: float,
    files_meta: Optional[Dict[str, Any]],
    files_data: Optional[Dict[str, bytes]],
) -> Optional[str]:
    try:
        import typst  # type: ignore[import-not-found]
    except ModuleNotFoundError:
        return f"{label}: Typst validation requires the 'typst' package. Install it with 'pip install typst'."

    with tempfile.TemporaryDirectory(prefix="ducpy-typst-") as tmpdir:
        project_dir = Path(tmpdir)
        main_path = project_dir / "main.typ"
        main_path.write_text(code.replace('"/scopture-files/', '"scopture-files/'), encoding="utf-8")
        _write_typst_external_files(project_dir, files_meta, files_data)

        try:
            try:
                typst.compile(str(main_path), format="pdf")
            except TypeError:
                typst.compile(str(main_path))
        except Exception as exc:
            return f"{label}: Typst validation failed\n{exc}"

    return None


def _validate_embedded_code(
    elements: List[Any],
    files_meta: Optional[Dict[str, Any]],
    files_data: Optional[Dict[str, bytes]],
    timeout_seconds: float,
) -> None:
    failures: List[str] = []

    for element in elements:
        if not isinstance(element, dict):
            continue

        element_type = element.get("type")
        label = _element_label(element)

        if element_type == "model":
            code = element.get("code")
            if isinstance(code, str) and code.strip():
                error = _run_python_validation(code, label, timeout_seconds)
                if error:
                    failures.append(error)
            continue

        if element_type == "doc":
            text = element.get("text")
            if isinstance(text, str) and text.strip():
                error = _run_typst_validation(text, label, timeout_seconds, files_meta, files_data)
                if error:
                    failures.append(error)

    if failures:
        raise DucSerializationValidationError(failures)


def serialize_duc(
    name: str,
    thumbnail: Optional[bytes] = None,
    dictionary: Optional[list] = None,
    elements: Optional[list] = None,
    duc_local_state: Any = None,
    duc_global_state: Any = None,
    version_graph: Any = None,
    blocks: Optional[list] = None,
    block_instances: Optional[list] = None,
    block_collections: Optional[list] = None,
    groups: Optional[list] = None,
    regions: Optional[list] = None,
    layers: Optional[list] = None,
    external_files: Optional[list] = None,
    validate_embedded_code: bool = True,
    validation_timeout_seconds: float = 30.0,
) -> bytes:
    """Serialize elements and document state to raw ``.duc`` binary format.

    This function accepts lists of elements created via the `ducpy.builders` API
    (e.g., `ElementBuilder`) and serializes them into the compressed format
    expected by `.duc` files. Element instances and state dataclasses are 
    automatically converted to the camelCase dicts expected by the Rust native module.

    Parameters
    ----------
    name : str
        The document name or identifier (used to populate the `source` field).
    thumbnail : Optional[bytes], default=None
        Raw PNG bytes representing a thumbnail of the document.
    dictionary : Optional[list], default=None
        List of Key-Value string pairs for dictionary entries.
    elements : Optional[list], default=None
        A list of elements (e.g., created via `ElementBuilder`) to include.
    duc_local_state : Any, default=None
        A `DucLocalState` object representing viewport state (pan, zoom, etc).
    duc_global_state : Any, default=None
        A `DucGlobalState` object representing document-wide settings.
    version_graph : Any, default=None
        Version history metadata of the document.
    blocks : Optional[list], default=None
        List of block definitions.
    block_instances : Optional[list], default=None
        List of block instances.
    block_collections : Optional[list], default=None
        List of block collections (libraries).
    groups : Optional[list], default=None
        List of element groups.
    regions : Optional[list], default=None
        List of boolean regions.
    layers : Optional[list], default=None
        List of document layers.
    external_files : Optional[list], default=None
        List of external files (e.g., embedded images or PDFs).
    validate_embedded_code : bool, default=True
        Validate model Python code and document source before native serialization.
        This is intended for server-side CPython usage and raises
        DucSerializationValidationError with per-element diagnostics on failure.
    validation_timeout_seconds : float, default=30.0
        Timeout used for each embedded code validation step.

    Returns
    -------
    bytes
        The raw `.duc` binary data, ready to be written to a file.
    """
    thumb = bytes(thumbnail) if thumbnail is not None else None

    files_meta, files_data = _convert_external_files(external_files)

    serialized_elements = [_element_to_camel(e) for e in (elements or [])]

    if validate_embedded_code:
        _validate_embedded_code(
            serialized_elements,
            files_meta,
            files_data,
            validation_timeout_seconds,
        )

    data: Dict[str, Any] = {
        "type": "duc",
        "version": DUC_SCHEMA_VERSION,
        "source": f"ducpy_{name}",
        "thumbnail": thumb,
        "elements": serialized_elements,
        "blocks": _convert_list(blocks) or [],
        "blockInstances": _convert_list(block_instances) or [],
        "blockCollections": _convert_list(block_collections) or [],
        "groups": _convert_list(groups) or [],
        "regions": _convert_list(regions) or [],
        "layers": _convert_list(layers) or [],
        "dictionary": _convert_dict_entries(dictionary) or {},
        "localState": to_serializable(duc_local_state),
        "globalState": to_serializable(duc_global_state),
        "versionGraph": to_serializable(version_graph),
        "files": files_meta,
        "filesData": files_data,
    }

    return ducpy_native.serialize_duc(data)
