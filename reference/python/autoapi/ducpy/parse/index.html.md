# ducpy.parse

Parse .duc files using the Rust native extension (ducpy_native).

Returns plain dicts with snake_case keys. Attribute-style access is available
via DucData wrapper.

## Attributes

| [`logger`](#ducpy.parse.logger)       |    |
|---------------------------------------|----|
| [`PathInput`](#ducpy.parse.PathInput) |    |

## Classes

| [`DucData`](#ducpy.parse.DucData)   | Dict subclass allowing attribute-style access (`data.elements`).   |
|-------------------------------------|--------------------------------------------------------------------|

## Functions

| [`_wrap`](#ducpy.parse._wrap)(→ Any)                                                                 | Recursively wrap dicts as DucData for attribute access.                 |
|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| [`_path`](#ducpy.parse._path)(→ str)                                                                 |                                                                         |
| [`parse_duc`](#ducpy.parse.parse_duc)(→ DucData)                                                     | Parse a `.duc` file into a [`DucData`](#ducpy.parse.DucData) dict.      |
| [`list_external_files`](#ducpy.parse.list_external_files)(→ List[DucData])                           | List metadata for all external files (without data blobs).              |
| [`stream_external_file_revision_to_path`](#ducpy.parse.stream_external_file_revision_to_path)(→ int) | Stream an external file revision from a `.duc` file into `output_path`. |
| [`stream_checkpoint_data_to_path`](#ducpy.parse.stream_checkpoint_data_to_path)(→ int)               | Stream checkpoint data from a `.duc` file into `output_path`.           |
| [`stream_delta_changeset_to_path`](#ducpy.parse.stream_delta_changeset_to_path)(→ int)               | Stream delta changeset data from a `.duc` file into `output_path`.      |

## Module Contents

### ducpy.parse.logger

### *class* ducpy.parse.DucData

Bases: `dict`

Dict subclass allowing attribute-style access (`data.elements`).

Initialize self.  See help(type(self)) for accurate signature.

#### \_\_getattr_\_(key: str) → Any

#### \_\_setattr_\_(key: str, value: Any) → None

Implement setattr(self, name, value).

#### \_\_delattr_\_(key: str) → None

Implement delattr(self, name).

### ducpy.parse.\_wrap(obj: Any) → Any

Recursively wrap dicts as DucData for attribute access.

### ducpy.parse.PathInput

### ducpy.parse.\_path(source: PathInput) → str

### ducpy.parse.parse_duc(source: PathInput) → [DucData](#ducpy.parse.DucData)

Parse a `.duc` file into a [`DucData`](#ducpy.parse.DucData) dict.

This function streams a .duc file path through the Rust native extension.
It returns a specialized dictionary (DucData)
that allows attribute-style access to the parsed properties (e.g. data.elements[0].id),
using snake_case keys instead of the internal camelCase format.

### Parameters

source
: Path to a `.duc` file.

### Returns

DucData
: An attribute-accessible dictionary matching the internal ExportedDataState
  schema with snake_case keys. Common keys include elements, duc_global_state,
  duc_local_state, and version_graph.

### Examples

```pycon
>>> data = duc.parse_duc("path/to/file.duc")
>>> print(f"Found {len(data.elements)} elements")
>>> print(f"First element type: {data.elements[0].type}")
```

### ducpy.parse.list_external_files(source: PathInput) → List[[DucData](#ducpy.parse.DucData)]

List metadata for all external files (without data blobs).

### ducpy.parse.stream_external_file_revision_to_path(source: PathInput, revision_id: str, output_path: PathInput) → int

Stream an external file revision from a `.duc` file into `output_path`.

### ducpy.parse.stream_checkpoint_data_to_path(source: PathInput, checkpoint_id: str, output_path: PathInput) → int

Stream checkpoint data from a `.duc` file into `output_path`.

### ducpy.parse.stream_delta_changeset_to_path(source: PathInput, delta_id: str, output_path: PathInput) → int

Stream delta changeset data from a `.duc` file into `output_path`.
