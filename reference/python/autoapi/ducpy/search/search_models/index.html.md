# ducpy.search.search_models

Scoped model-element search helpers.

Model elements (`DucModelElement`, element type `"model"`) embed CAD/BIM
content in one of two ways:

1. **Embedded Python code** (`model_type == "python"`) whose imports reveal
   the real engine — `ezdxf`, `ifcopenshell` or `build123d`.
2. **Linked external files** (`model_type` is `dxf` / `ifc` / `step` /
   …) whose blobs live in the connected external files (`file_ids`).

Before any content can be searched we must classify each model into the engine
that produced it:

| Engine      | Sources                                                      |
|-------------|--------------------------------------------------------------|
| ezdxf       | `model_type` `dxf` / `dwg`, or Python importing `ezdxf`      |
| ifc         | `model_type` `ifc`, or Python importing `ifcopenshell`       |
| build123d   | `model_type` `step` / `stl`, or Python importing `build123d` |
| unsupported | anything we can’t classify                                   |

This module detects each engine and searches user-facing content for the ezdxf
and IFC engines. Build123d elements currently remain searchable through their
DUC label and description.

## Classes

| [`ModelEngine`](#ducpy.search.search_models.ModelEngine)           | CAD/BIM engine responsible for a model element's content.   |
|--------------------------------------------------------------------|-------------------------------------------------------------|
| [`ModelElementInfo`](#ducpy.search.search_models.ModelElementInfo) | Engine classification of a single model element.            |

## Functions

| [`extract_python_imports`](#ducpy.search.search_models.extract_python_imports)(→ set[str])                           | Return the top-level module names imported by `code`.                                                        |
|----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| [`detect_model_engine`](#ducpy.search.search_models.detect_model_engine)(→ ModelEngine)                              | Classify a parsed model element into a [`ModelEngine`](#ducpy.search.search_models.ModelEngine).             |
| [`model_element_info`](#ducpy.search.search_models.model_element_info)(→ ModelElementInfo)                           | Build a [`ModelElementInfo`](#ducpy.search.search_models.ModelElementInfo) from a parsed model element dict. |
| [`iter_model_elements`](#ducpy.search.search_models.iter_model_elements)(→ Iterator[dict[str, Any]])                 | Yield non-deleted model elements from parsed duc data.                                                       |
| [`resolve_model_search_targets`](#ducpy.search.search_models.resolve_model_search_targets)(→ list[ModelElementInfo]) | Classify every live model element in parsed duc data.                                                        |
| [`search_duc_models`](#ducpy.search.search_models.search_duc_models)(...)                                            | Search the user-authored text inside model elements and rank the results.                                    |

## Module Contents

### *class* ducpy.search.search_models.ModelEngine

Bases: `str`, `enum.Enum`

CAD/BIM engine responsible for a model element’s content.

Initialize self.  See help(type(self)) for accurate signature.

#### EZDXF *= 'ezdxf'*

#### IFC *= 'ifc'*

#### BUILD123D *= 'build123d'*

#### UNSUPPORTED *= 'unsupported'*

### *class* ducpy.search.search_models.ModelElementInfo

Engine classification of a single model element.

#### element_id *: str*

#### label *: str*

#### model_type *: str*

#### engine *: [ModelEngine](#ducpy.search.search_models.ModelEngine)*

#### is_python *: bool*

#### has_code *: bool*

#### file_ids *: tuple[str, Ellipsis]*

### ducpy.search.search_models.extract_python_imports(code: str | None) → set[str]

Return the top-level module names imported by `code`.

Uses `ast` for accuracy and falls back to a line-based regex when the
source can’t be parsed (e.g. an extracted fragment or a syntax error).

### ducpy.search.search_models.detect_model_engine(element: dict[str, Any]) → [ModelEngine](#ducpy.search.search_models.ModelEngine)

Classify a parsed model element into a [`ModelEngine`](#ducpy.search.search_models.ModelEngine).

### ducpy.search.search_models.model_element_info(element: dict[str, Any]) → [ModelElementInfo](#ducpy.search.search_models.ModelElementInfo)

Build a [`ModelElementInfo`](#ducpy.search.search_models.ModelElementInfo) from a parsed model element dict.

### ducpy.search.search_models.iter_model_elements(duc_data: dict[str, Any]) → Iterator[dict[str, Any]]

Yield non-deleted model elements from parsed duc data.

### ducpy.search.search_models.resolve_model_search_targets(duc_data: dict[str, Any]) → list[[ModelElementInfo](#ducpy.search.search_models.ModelElementInfo)]

Classify every live model element in parsed duc data.

### ducpy.search.search_models.search_duc_models(duc_path: str | pathlib.Path, query: str, , output_path: str | pathlib.Path | None = None, limit: int = 50, run_code: bool = False) → [ducpy.search.search_elements.DucSearchResponse](../search_elements/index.md#ducpy.search.search_elements.DucSearchResponse)

Search the user-authored text inside model elements and rank the results.

Loads the `.duc` (SQLite-backed or native binary), classifies each model
element, extracts searchable DXF/DWG or IFC content, and scores it against
`query` with the same ranking machinery as `search_duc_elements()`.
Build123d models currently fall back to their label and description.

`run_code` is a trusted-input opt-in. The default (`False`) searches
linked model files only. Setting it to `True` executes embedded Python
model code in-process to capture generated DXF or IFC content; never enable
it for untrusted DUC files. Results are written to `output_path`
(or a default path beside the `.duc`) and returned as a
`DucSearchResponse`.
