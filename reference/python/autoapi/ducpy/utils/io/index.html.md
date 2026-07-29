# ducpy.utils.io

This module provides high-level functions for reading and writing DUC files.

## Functions

| [`write_duc_file`](#ducpy.utils.io.write_duc_file)(file_path, name[, thumbnail, ...])   | Serializes an ExportedDataState object to a .duc file.        |
|-----------------------------------------------------------------------------------------|---------------------------------------------------------------|
| [`read_duc_file`](#ducpy.utils.io.read_duc_file)(→ ducpy.parse.DucData)                 | Parses a .duc file into a DucData dict with attribute access. |

## Module Contents

### ducpy.utils.io.write_duc_file(file_path: str, name: str, thumbnail: bytes | None = None, dictionary: list | None = None, elements: list | None = None, duc_local_state: Any = None, duc_global_state: Any = None, version_graph: Any = None, blocks: list | None = None, block_instances: list | None = None, block_collections: list | None = None, groups: list | None = None, regions: list | None = None, layers: list | None = None, external_files: list | None = None, charter: Any = None, issues: list | None = None)

Serializes an ExportedDataState object to a .duc file.

### ducpy.utils.io.read_duc_file(file_path: str) → [ducpy.parse.DucData](../../parse/index.md#ducpy.parse.DucData)

Parses a .duc file into a DucData dict with attribute access.
