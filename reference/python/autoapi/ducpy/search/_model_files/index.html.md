# ducpy.search._model_files

Internal helpers for reading model-linked external files from DUC data.

## Attributes

| [`logger`](#ducpy.search._model_files.logger)   |    |
|-------------------------------------------------|----|

## Functions

| [`stream_active_external_file_to_path`](#ducpy.search._model_files.stream_active_external_file_to_path)(→ int)   | Stream a model-linked file's active revision to a caller-owned path.   |
|------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|

## Module Contents

### ducpy.search._model_files.logger

### ducpy.search._model_files.stream_active_external_file_to_path(duc_source: str | pathlib.Path, file_id: str, output_path: str | pathlib.Path) → int

Stream a model-linked file’s active revision to a caller-owned path.
