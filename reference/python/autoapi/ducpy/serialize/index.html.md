# ducpy.serialize

Serialize DUC data using the Rust native extension (ducpy_native).

## Attributes

| [`logger`](#ducpy.serialize.logger)                                 |    |
|---------------------------------------------------------------------|----|
| [`DUC_SCHEMA_VERSION`](#ducpy.serialize.DUC_SCHEMA_VERSION)         |    |
| [`_ELEMENT_CLASS_TO_TYPE`](#ducpy.serialize._ELEMENT_CLASS_TO_TYPE) |    |

## Exceptions

| [`DucSerializationValidationError`](#ducpy.serialize.DucSerializationValidationError)   | Raised when embedded element code fails validation before serialization.   |
|-----------------------------------------------------------------------------------------|----------------------------------------------------------------------------|

## Functions

| [`_element_to_camel`](#ducpy.serialize._element_to_camel)(→ dict)                                          | Convert an element (or ElementWrapper) to the camelCase dict Rust expects.          |
|------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| [`_convert_external_files`](#ducpy.serialize._convert_external_files)(→ Tuple[Optional[Dict[str, ...)      | Convert DucExternalFile dict (or legacy list) to camelCase dicts for serialization. |
| [`_convert_dict_entries`](#ducpy.serialize._convert_dict_entries)(→ Optional[Dict[str, str]])              | Convert a list of DictionaryEntry to a `{key: value}` dict.                         |
| [`_convert_list`](#ducpy.serialize._convert_list)(→ Optional[list])                                        | Convert a list of dataclass instances to camelCase dicts.                           |
| [`_element_label`](#ducpy.serialize._element_label)(→ str)                                                 |                                                                                     |
| [`_find_revision`](#ducpy.serialize._find_revision)(→ Optional[Dict[str, Any]])                            |                                                                                     |
| [`_write_python_external_files`](#ducpy.serialize._write_python_external_files)(→ Dict[str, str])          |                                                                                     |
| [`_run_python_validation`](#ducpy.serialize._run_python_validation)(→ Optional[str])                       |                                                                                     |
| [`_run_python_validation_in_process`](#ducpy.serialize._run_python_validation_in_process)(→ Optional[str]) |                                                                                     |
| [`_write_typst_external_files`](#ducpy.serialize._write_typst_external_files)(→ None)                      |                                                                                     |
| [`_format_typst_validation_error`](#ducpy.serialize._format_typst_validation_error)(→ str)                 |                                                                                     |
| [`_run_typst_validation`](#ducpy.serialize._run_typst_validation)(→ Optional[str])                         |                                                                                     |
| [`_validate_embedded_code`](#ducpy.serialize._validate_embedded_code)(→ None)                              |                                                                                     |
| [`serialize_duc`](#ducpy.serialize.serialize_duc)(→ str)                                                   | Serialize elements and document state directly to a `.duc` file path.               |

## Module Contents

### ducpy.serialize.logger

### *exception* ducpy.serialize.DucSerializationValidationError(failures: List[str])

Bases: `ValueError`

Raised when embedded element code fails validation before serialization.

Initialize self.  See help(type(self)) for accurate signature.

#### failures

### ducpy.serialize.DUC_SCHEMA_VERSION

### ducpy.serialize.\_ELEMENT_CLASS_TO_TYPE *: Dict[str, str]*

### ducpy.serialize.\_element_to_camel(wrapper_or_element: Any) → dict

Convert an element (or ElementWrapper) to the camelCase dict Rust expects.

### ducpy.serialize.\_convert_external_files(entries: Any | None) → Tuple[Dict[str, Any] | None, Dict[str, bytes] | None]

Convert DucExternalFile dict (or legacy list) to camelCase dicts for serialization.

Returns `(files_meta, files_data)` where *files_meta* contains revision
metadata (no blobs) and *files_data* maps revision-id → raw bytes for the
separate `filesData` key expected by the Rust serializer.

### ducpy.serialize.\_convert_dict_entries(entries: list | None) → Dict[str, str] | None

Convert a list of DictionaryEntry to a `{key: value}` dict.

### ducpy.serialize.\_convert_list(items: list | None) → list | None

Convert a list of dataclass instances to camelCase dicts.

### ducpy.serialize.\_element_label(element: Dict[str, Any]) → str

### ducpy.serialize.\_find_revision(revisions: Any, active_revision_id: str) → Dict[str, Any] | None

### ducpy.serialize.\_write_python_external_files(project_dir: pathlib.Path, files_meta: Dict[str, Any] | None, files_data: Dict[str, bytes] | None) → Dict[str, str]

### ducpy.serialize.\_run_python_validation(code: str, label: str, timeout_seconds: float | None, files_meta: Dict[str, Any] | None = None, files_data: Dict[str, bytes] | None = None) → str | None

### ducpy.serialize.\_run_python_validation_in_process(code: str, label: str, project_dir: pathlib.Path, resolved_files: Dict[str, str]) → str | None

### ducpy.serialize.\_write_typst_external_files(project_dir: pathlib.Path, files_meta: Dict[str, Any] | None, files_data: Dict[str, bytes] | None) → None

### ducpy.serialize.\_format_typst_validation_error(exc: Exception, main_path: pathlib.Path) → str

### ducpy.serialize.\_run_typst_validation(code: str, label: str, timeout_seconds: float, files_meta: Dict[str, Any] | None, files_data: Dict[str, bytes] | None) → str | None

### ducpy.serialize.\_validate_embedded_code(elements: List[Any], files_meta: Dict[str, Any] | None, files_data: Dict[str, bytes] | None, timeout_seconds: float | None) → None

### ducpy.serialize.serialize_duc(name: str, output_path: str | pathlib.Path | None = None, thumbnail: bytes | None = None, dictionary: list | None = None, elements: list | None = None, duc_local_state: Any = None, duc_global_state: Any = None, version_graph: Any = None, blocks: list | None = None, block_instances: list | None = None, block_collections: list | None = None, groups: list | None = None, regions: list | None = None, layers: list | None = None, external_files: list | None = None, charter: Any = None, issues: list | None = None, validate_embedded_code: bool = True, validation_timeout_seconds: float | None = None) → str

Serialize elements and document state directly to a `.duc` file path.

This function accepts lists of elements created via the ducpy.builders API
(e.g., ElementBuilder) and serializes them into the compressed format
expected by .duc files. Element instances and state dataclasses are
automatically converted to the camelCase dicts expected by the Rust native module.

### Parameters

name
: The document name or identifier (used to populate the source field).

output_path
: Target path for the generated `.duc` file. When omitted, a temporary
  `.duc` file is created and its path is returned.

thumbnail
: Raw PNG bytes representing a thumbnail of the document.

dictionary
: List of Key-Value string pairs for dictionary entries.

elements
: A list of elements (e.g., created via ElementBuilder) to include.

duc_local_state
: A DucLocalState object representing viewport state (pan, zoom, etc).

duc_global_state
: A DucGlobalState object representing document-wide settings.

version_graph
: Version history metadata of the document.

blocks
: List of block definitions.

block_instances
: List of block instances.

block_collections
: List of block collections (libraries).

groups
: List of element groups.

regions
: List of boolean regions.

layers
: List of document layers.

external_files
: List of external files (e.g., embedded images or PDFs).

charter
: Project charter object (DucCharter) or dict.

issues
: List of issue objects (DucIssue) or dicts.

validate_embedded_code
: Validate model Python code and document source before native serialization.
  This is intended for server-side CPython usage and raises
  DucSerializationValidationError with per-element diagnostics on failure.

validation_timeout_seconds
: Timeout used for each embedded code validation step. If None, no timeout is applied.

### Returns

str
: The output path that was written.
