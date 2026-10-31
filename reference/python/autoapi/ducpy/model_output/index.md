# ducpy.model_output

Typed model artifacts shared by desktop and cloud Python workers.

## Attributes

| [`KINDS`](#ducpy.model_output.KINDS)   |    |
|----------------------------------------------------------|----|

## Classes

| [`ModelOutputCollector`](#ducpy.model_output.ModelOutputCollector)   |    |
|-------------------------------------------------------------------------|----|

## Functions

| [`_shims`](#ducpy.model_output._shims)()   |    |
|-------------------------------------------------------------|----|

## Module Contents

### ducpy.model_output.KINDS

### ducpy.model_output.\_shims()

### *class* ducpy.model_output.ModelOutputCollector(payload: dict, mounted_files: dict, workspace: pathlib.Path, limit: int, preview_limit: int | None = None)

#### payload

#### files

#### workspace

#### limit

#### preview_limit

#### declaration *: dict | None* *= None*

#### emit_output(value: Any = None, , kind: str, data: Any = None, path: str | None = None, mime_type: str | None = None, filename: str | None = None) → None

#### collect(events: list[dict], globals_dict: dict, output_path: pathlib.Path, legacy_kind: str, now: str) → dict | None
