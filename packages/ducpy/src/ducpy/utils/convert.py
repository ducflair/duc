"""
Utilities for converting between Python snake_case and Rust/JSON camelCase naming,
and for flattening/nesting element structures to match the Rust serde layout.
"""

from __future__ import annotations

import re
from dataclasses import asdict, is_dataclass
from typing import Any, Dict, List, Optional, Union

_CAMEL_RE1 = re.compile(r"(.)([A-Z][a-z]+)")
_CAMEL_RE2 = re.compile(r"([a-z0-9])([A-Z])")


def camel_to_snake(name: str) -> str:
    s1 = _CAMEL_RE1.sub(r"\1_\2", name)
    return _CAMEL_RE2.sub(r"\1_\2", s1).lower()


def snake_to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


# Explicit renames for snake→camel direction (Python field → Rust serde key).
# Standard snake_to_camel would produce the wrong key for these.
_SNAKE_TO_CAMEL_OVERRIDES: Dict[str, str] = {
    "duc_local_state": "localState",
    "duc_global_state": "globalState",
}

# Keys that are nested in Python dataclasses but flattened in Rust serde output.
# When serializing, these dicts are merged into the parent.
_FLATTEN_KEYS = frozenset({
    "base",
    "styles",
    "linear_base",
    "stack_element_base",
})


def deep_camel_to_snake(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {camel_to_snake(k): deep_camel_to_snake(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deep_camel_to_snake(item) for item in obj]
    return obj


def deep_snake_to_camel(obj: Any) -> Any:
    if isinstance(obj, dict):
        result = {}
        for k, v in obj.items():
            ck = _SNAKE_TO_CAMEL_OVERRIDES.get(k, snake_to_camel(k))
            result[ck] = deep_snake_to_camel(v)
        return result
    if isinstance(obj, list):
        return [deep_snake_to_camel(item) for item in obj]
    if is_dataclass(obj) and not isinstance(obj, type):
        return deep_snake_to_camel(asdict(obj))
    if isinstance(obj, bytes):
        return list(obj)
    return obj


def _flatten_dict(d: dict) -> dict:
    """Recursively flatten keys that Rust serde #[serde(flatten)] would flatten."""
    result: dict = {}
    for k, v in d.items():
        if k in _FLATTEN_KEYS and isinstance(v, dict):
            result.update(_flatten_dict(v))
        else:
            result[k] = v
    return result


def to_serializable(obj: Any) -> Any:
    """Convert a value to a JSON-serializable form suitable for the Rust native module.

    Handles:
    - Dataclass instances → dict (recursively)
    - bytes → list of ints
    - Nested base/styles/linear_base/stack_element_base → flattened
    - snake_case keys → camelCase keys
    """
    if obj is None:
        return None
    if is_dataclass(obj) and not isinstance(obj, type):
        d = {}
        for k, v in asdict(obj).items():
            d[k] = v
        d = _flatten_dict(d)
        return deep_snake_to_camel(d)
    if isinstance(obj, dict):
        return deep_snake_to_camel(obj)
    if isinstance(obj, list):
        return [to_serializable(item) for item in obj]
    if isinstance(obj, bytes):
        return list(obj)
    return obj
