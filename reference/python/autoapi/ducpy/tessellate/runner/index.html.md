# ducpy.tessellate.runner

CAD and BIM model tessellation execution engine for ducpy.

Compiles and tessellates model elements into canonical model cache payloads:
- parametric-json: compact { instances, shapes } numpy buffer JSON for build123d, cadquery, STEP, STL.
- ifc-json: triangulated { version: 2, parts: […] } scene graph via ifcopenshell.geom.
- python-dxf: 2D/3D DXF drawings via ezdxf.

## Functions

| [`_normalize_model_type`](#ducpy.tessellate.runner._normalize_model_type)(→ str)               |                                                                                      |
|---------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| [`_deduce_model_output_kind`](#ducpy.tessellate.runner._deduce_model_output_kind)(→ str)           |                                                                                      |
| [`_build_external_file_code`](#ducpy.tessellate.runner._build_external_file_code)(→ str)           | Generate canonical model code loading an external file reference.                    |
| [`tessellate_external_file`](#ducpy.tessellate.runner.tessellate_external_file)(→ dict[str, Any]) | Directly tessellates a local CAD/BIM file (STEP, STL, IFC, DXF).                     |
| [`tessellate_model_code`](#ducpy.tessellate.runner.tessellate_model_code)(→ dict[str, Any])    | Executes CAD Python code and captures the tessellated preview payload.               |
| [`tessellate_duc_element`](#ducpy.tessellate.runner.tessellate_duc_element)(→ dict[str, Any])   | Extracts a model element and its external files from a .duc file and tessellates it. |

## Module Contents

### ducpy.tessellate.runner.\_normalize_model_type(model_type: str | None) → str

### ducpy.tessellate.runner.\_deduce_model_output_kind(model_type: str) → str

### ducpy.tessellate.runner.\_build_external_file_code(model_type: str, file_id: str) → str

Generate canonical model code loading an external file reference.

### ducpy.tessellate.runner.tessellate_external_file(file_path: str | pathlib.Path, model_type: str | None = None) → dict[str, Any]

Directly tessellates a local CAD/BIM file (STEP, STL, IFC, DXF).

Args:
: file_path: Path to the CAD or IFC file.
  model_type: Optional explicit type (‘step’, ‘stl’, ‘ifc’, ‘dxf’).
  <br/>
  > If not specified, inferred from file extension.

Returns:
: Dict with “success”, “kind”, “payload” (JSON string or dict).

### ducpy.tessellate.runner.tessellate_model_code(code: str, model_type: str = 'python', model_output_kind: str | None = None, external_files: dict[str, Any] | list[dict[str, Any]] | None = None, model_modules: list[dict[str, Any]] | None = None, workspace_dir: str | pathlib.Path | None = None) → dict[str, Any]

Executes CAD Python code and captures the tessellated preview payload.

Args:
: code: Python source code defining CAD/BIM elements and calling show().
  model_type: “python”, “step”, “stl”, “ifc”, “dxf”, “dwg”.
  model_output_kind: “parametric”, “ifc”, or “dxf”. Inferred if None.
  external_files: Map or list of external files available to the script.
  model_modules: Lazy dependency modules for duc_model.\* imports.
  workspace_dir: Working directory for execution and output files.

Returns:
: Dict with “success”, “kind”, “payload” (JSON string or dict), “stdout”, “stderr”.

### ducpy.tessellate.runner.tessellate_duc_element(duc_file_path: str | pathlib.Path, element_id: str, output_path: str | pathlib.Path | None = None) → dict[str, Any]

Extracts a model element and its external files from a .duc file and tessellates it.

Args:
: duc_file_path: Path to the .duc file.
  element_id: ID of the model element inside the .duc file.
  output_path: Optional path to write the resulting JSON model cache payload.

Returns:
: Dict with “success”, “kind”, “payload”, “elementId”, “modelType”.
