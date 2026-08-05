"""
Parse .duc files using the Rust native extension (ducpy_native).

Returns plain dicts with snake_case keys. Attribute-style access is available
via DucData wrapper.
"""

from __future__ import annotations

import logging
from os import PathLike, fspath
from typing import Any, List, Union

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


PathInput = Union[str, PathLike[str]]


def _path(source: PathInput) -> str:
    if isinstance(source, (bytes, bytearray)) or hasattr(source, "read"):
        raise TypeError("DUC streaming APIs require a filesystem path, not bytes or file objects")
    return fspath(source)


def parse_duc(source: PathInput) -> DucData:
    """Parse a ``.duc`` file into a :class:`DucData` dict.

    This function streams a `.duc` file path through the Rust native extension.
    It returns a specialized dictionary (`DucData`)
    that allows attribute-style access to the parsed properties (e.g. `data.elements[0].id`),
    using `snake_case` keys instead of the internal `camelCase` format.

    Parameters
    ----------
    source : str | PathLike
        Path to a ``.duc`` file.

    Returns
    -------
    DucData
        An attribute-accessible dictionary matching the internal `ExportedDataState` 
        schema with snake_case keys. Common keys include `elements`, `duc_global_state`, 
        `duc_local_state`, and `version_graph`.
        
    Examples
    --------
    >>> data = duc.parse_duc("path/to/file.duc")
    >>> print(f"Found {len(data.elements)} elements")
    >>> print(f"First element type: {data.elements[0].type}")
    """
    raw = ducpy_native.parse_duc(_path(source))
    return _wrap(deep_camel_to_snake(raw))


def list_external_files(
    source: PathInput,
) -> List[DucData]:
    """List metadata for all external files (without data blobs)."""
    raw = ducpy_native.list_external_files(_path(source))
    return _wrap(deep_camel_to_snake(raw))


def stream_external_file_revision_to_path(
    source: PathInput,
    revision_id: str,
    output_path: PathInput,
) -> int:
    """Stream an external file revision from a ``.duc`` file into ``output_path``."""
    return ducpy_native.stream_external_file_revision_to_path(
        _path(source),
        revision_id,
        _path(output_path),
    )


def stream_checkpoint_data_to_path(
    source: PathInput,
    checkpoint_id: str,
    output_path: PathInput,
) -> int:
    """Stream checkpoint data from a ``.duc`` file into ``output_path``."""
    return ducpy_native.stream_checkpoint_data_to_path(
        _path(source),
        checkpoint_id,
        _path(output_path),
    )


def stream_delta_changeset_to_path(
    source: PathInput,
    delta_id: str,
    output_path: PathInput,
) -> int:
    """Stream delta changeset data from a ``.duc`` file into ``output_path``."""
    return ducpy_native.stream_delta_changeset_to_path(
        _path(source),
        delta_id,
        _path(output_path),
    )
