"""
Serialize DUC data using the Rust native extension (ducpy_native).
"""

from __future__ import annotations

import logging
import re
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import ducpy_native
from ducpy.utils.convert import (deep_snake_to_camel, snake_to_camel,
                                 to_serializable)

logger = logging.getLogger(__name__)


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
        schema_path = Path(__file__).resolve().parents[4] / "schema" / "duc.sql"
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
    entries: Optional[list],
) -> Optional[Dict[str, Any]]:
    """Convert a list of DucExternalFileEntry to a ``{id: data}`` dict."""
    if not entries:
        return None
    result: dict = {}
    for entry in entries:
        if is_dataclass(entry):
            entry = asdict(entry)
        if isinstance(entry, dict):
            key = entry.get("key", entry.get("id", ""))
            value = entry.get("value", entry)
            if is_dataclass(value):
                value = asdict(value)
            result[key] = deep_snake_to_camel(value) if isinstance(value, dict) else value
        else:
            continue
    return result if result else None


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
) -> bytes:
    """Serialize elements to ``.duc`` format.
    Element instances and state dataclasses are automatically converted to the
    camelCase dicts expected by the Rust native module.
    """
    thumb = bytes(thumbnail) if thumbnail is not None else None

    data: Dict[str, Any] = {
        "type": "duc",
        "version": DUC_SCHEMA_VERSION,
        "source": f"ducpy_{name}",
        "thumbnail": thumb,
        "elements": [_element_to_camel(e) for e in (elements or [])],
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
        "files": _convert_external_files(external_files),
    }

    return ducpy_native.serialize_duc(data)

