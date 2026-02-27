"""
Parse .duc files using the Rust native extension (ducpy_native).

Returns plain dicts with snake_case keys. Attribute-style access is available
via DucData wrapper.
"""

from __future__ import annotations

import logging
from typing import Any, BinaryIO, Dict, List, Optional, Union

import ducpy_native
from ducpy.utils.convert import deep_camel_to_snake

logger = logging.getLogger(__name__)


class DucData(dict):
    """Dict subclass allowing attribute-style access (``data.elements``)."""

    def __getattr__(self, key: str) -> Any:
        try:
            return self[key]
        except KeyError:
            raise AttributeError(key)

    def __setattr__(self, key: str, value: Any) -> None:
        self[key] = value

    def __delattr__(self, key: str) -> None:
        try:
            del self[key]
        except KeyError:
            raise AttributeError(key)


def _wrap(obj: Any) -> Any:
    """Recursively wrap dicts as DucData for attribute access."""
    if isinstance(obj, dict):
        return DucData({k: _wrap(v) for k, v in obj.items()})
    if isinstance(obj, list):
        return [_wrap(item) for item in obj]
    return obj


def _read_bytes(source: Union[bytes, bytearray, BinaryIO, str]) -> bytes:
    """Accept bytes, a file-like object, or a file path and return raw bytes."""
    if isinstance(source, (bytes, bytearray)):
        return bytes(source)
    if isinstance(source, str):
        with open(source, "rb") as f:
            return f.read()
    return source.read()


def parse_duc(source: Union[bytes, bytearray, BinaryIO, str]) -> DucData:
    """Parse a ``.duc`` file into a :class:`DucData` dict.

    Parameters
    ----------
    source : bytes | file | str
        Raw bytes, an open binary file, or a path to a ``.duc`` file.

    Returns
    -------
    DucData
        Attribute-accessible dict matching the ExportedDataState schema with
        snake_case keys.
    """
    buf = _read_bytes(source)
    raw = ducpy_native.parse_duc(buf)
    return _wrap(deep_camel_to_snake(raw))


def parse_duc_lazy(source: Union[bytes, bytearray, BinaryIO, str]) -> DucData:
    """Parse a ``.duc`` file lazily (external file data blobs are omitted).

    Use :func:`get_external_file` or :func:`list_external_files` to retrieve
    external file data on demand.
    """
    buf = _read_bytes(source)
    raw = ducpy_native.parse_duc_lazy(buf)
    return _wrap(deep_camel_to_snake(raw))


def get_external_file(
    source: Union[bytes, bytearray, BinaryIO, str],
    file_id: str,
) -> Optional[DucData]:
    """Fetch a single external file entry from a ``.duc`` buffer."""
    buf = _read_bytes(source)
    raw = ducpy_native.get_external_file(buf, file_id)
    if raw is None:
        return None
    return _wrap(deep_camel_to_snake(raw))


def list_external_files(
    source: Union[bytes, bytearray, BinaryIO, str],
) -> List[DucData]:
    """List metadata for all external files (without data blobs)."""
    buf = _read_bytes(source)
    raw = ducpy_native.list_external_files(buf)
    return _wrap(deep_camel_to_snake(raw))

