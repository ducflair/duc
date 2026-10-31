# ducpy.tessellate.shims

CAD and BIM tessellation and capture shims for ducpy.

Matches the exact tessellation and geometry extraction logic used across
Scopture and Ducflair runtimes (three-cad-viewer buffer JSON, ifcopenshell triangulation).

## Classes

| [`FontEnum`](#ducpy.tessellate.shims.FontEnum)   | Immutable font manifest with sequence, key, and attribute access.   |
|-------------------------------------------------------------|---------------------------------------------------------------------|

## Functions

| [`scopture_is_model_dependency_call`](#ducpy.tessellate.shims.scopture_is_model_dependency_call)(→ bool)     | Return whether the current call stack is executing a duc_model module.         |
|------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| [`scopture_install_model_modules`](#ducpy.tessellate.shims.scopture_install_model_modules)(→ None)        | Install one execution's model-element sources as a lazy Python package.        |
| [`scopture_install_fonts`](#ducpy.tessellate.shims.scopture_install_fonts)(→ None)                | Register mounted TTF files with OCCT and expose name-based resolution.         |
| [`scopture_flatten_candidates`](#ducpy.tessellate.shims.scopture_flatten_candidates)(→ list[Any])      | Recursively flatten nested lists/tuples/sets of objects into a flat list.      |
| [`scopture_tessellate_to_buffer_json`](#ducpy.tessellate.shims.scopture_tessellate_to_buffer_json)(→ str)     | Tessellate CAD objects and return a compact JSON payload using base64 buffers. |
| [`scopture_install_ipython_stub`](#ducpy.tessellate.shims.scopture_install_ipython_stub)(→ None)         | Install a stub for IPython.lib.pretty so build123d can import it.              |
| [`scopture_install_ifc_output_capture`](#ducpy.tessellate.shims.scopture_install_ifc_output_capture)(→ None)   | Patch ifcopenshell.file.write to also write to output_path.                    |
| [`scopture_install_dxf_output_capture`](#ducpy.tessellate.shims.scopture_install_dxf_output_capture)(→ None)   | Patch ezdxf.document.Drawing.saveas to also write to output_path.              |
| [`scopture_collect_model_file`](#ducpy.tessellate.shims.scopture_collect_model_file)(→ dict[str, Any]) | Find an ifcopenshell or ezdxf object in globals and write it to output_path.   |
| [`scopture_collect_ifc_preview`](#ducpy.tessellate.shims.scopture_collect_ifc_preview)(→ str | None)    | Tessellate an IFC model and return a compact JSON preview payload.             |

## Module Contents

### ducpy.tessellate.shims.scopture_is_model_dependency_call() → bool

Return whether the current call stack is executing a duc_model module.

### ducpy.tessellate.shims.scopture_install_model_modules(model_modules: list[dict[str, Any]] | None, runtime_globals: dict[str, Any]) → None

Install one execution’s model-element sources as a lazy Python package.

### *class* ducpy.tessellate.shims.FontEnum(values: Any)

Immutable font manifest with sequence, key, and attribute access.

#### \_values

#### \_by_name

#### \_by_attribute *: dict[str, str]*

#### \_\_iter_\_()

#### \_\_len_\_() → int

#### \_\_getitem_\_(key: Any) → Any

#### \_\_getattr_\_(name: str) → str

#### \_\_repr_\_() → str

### ducpy.tessellate.shims.scopture_install_fonts(mounted_external_files: dict[str, dict[str, str]]) → None

Register mounted TTF files with OCCT and expose name-based resolution.

### ducpy.tessellate.shims.scopture_flatten_candidates(\*objs: Any) → list[Any]

Recursively flatten nested lists/tuples/sets of objects into a flat list.

### ducpy.tessellate.shims.scopture_tessellate_to_buffer_json(\*objs: Any, \*\*kwargs: Any) → str

Tessellate CAD objects and return a compact JSON payload using base64 buffers.

Uses the instanced format {instances, shapes} with numpy_to_buffer_json encoding.
The client-side three-cad-viewer renderer handles this format via decodeInstancedFormat().

### ducpy.tessellate.shims.scopture_install_ipython_stub() → None

Install a stub for IPython.lib.pretty so build123d can import it.

### ducpy.tessellate.shims.scopture_install_ifc_output_capture(output_path: str, sandbox_path: Callable[[str | os.PathLike[str], str | pathlib.Path], pathlib.Path] | None = None) → None

Patch ifcopenshell.file.write to also write to output_path.

### ducpy.tessellate.shims.scopture_install_dxf_output_capture(output_path: str, sandbox_path: Callable[[str | os.PathLike[str], str | pathlib.Path], pathlib.Path] | None = None) → None

Patch ezdxf.document.Drawing.saveas to also write to output_path.

### ducpy.tessellate.shims.scopture_collect_model_file(globals_dict: dict[str, Any], fmt: str, output_path: str | pathlib.Path, max_model_file_bytes: int = 0, now_fn: Callable[[], int] | None = None) → dict[str, Any]

Find an ifcopenshell or ezdxf object in globals and write it to output_path.

### ducpy.tessellate.shims.scopture_collect_ifc_preview(globals_dict: dict[str, Any], output_path: str | pathlib.Path | None = None, max_preview_bytes: int = 0) → str | None

Tessellate an IFC model and return a compact JSON preview payload.

Searches globals_dict for ifcopenshell.file objects, falls back to
reading from output_path. Uses ifcopenshell.geom for triangulation.
