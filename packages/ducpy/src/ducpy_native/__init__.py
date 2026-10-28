"""Python shim for the compiled :mod:`ducpy_native` extension.

When built with maturin (``module-name = "ducpy_native"`` and
``python-source = "src"``), the compiled extension is emitted as the
submodule ``ducpy_native.ducpy_native``. Re-export the extension symbols at the
package root so existing imports like ``import ducpy_native`` continue to work.
"""

from .ducpy_native import (normalize_host_path, normalize_path_segments,
                           get_owning_duc_directory, resolve_locator_path, resolve_locator,
                           list_external_files, parse_duc,  # type: ignore[attr-defined]
                           serialize_duc, stream_external_file_revision_to_path,
                           stream_checkpoint_data_to_path,
                           stream_delta_changeset_to_path,
                           get_schema_version,
                           get_schema_version_int, get_duc_schema_sql,
                           get_version_control_schema_sql,
                           get_search_schema_sql, get_migrations)

__all__ = [
    "normalize_host_path", "normalize_path_segments", "get_owning_duc_directory",
    "resolve_locator_path", "resolve_locator",
    "parse_duc",
    "serialize_duc",
    "list_external_files",
    "stream_external_file_revision_to_path",
    "stream_checkpoint_data_to_path",
    "stream_delta_changeset_to_path",
    "get_schema_version",
    "get_schema_version_int",
    "get_duc_schema_sql",
    "get_version_control_schema_sql",
    "get_search_schema_sql",
    "get_migrations",
]
