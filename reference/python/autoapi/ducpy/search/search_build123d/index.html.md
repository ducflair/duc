# ducpy.search.search_build123d

Semantic text extraction for build123d model elements.

Only metadata materialized into a CAD model is indexed: shape/assembly labels,
materials, joints, viewer names, STEP product metadata, and ASCII STL solid
names. Python source, raw STEP syntax, geometry, coordinates, and binary STL
headers are deliberately excluded.

## Classes

| [`Build123dTextItem`](#ducpy.search.search_build123d.Build123dTextItem)   | One semantic text value extracted from a build123d-backed model.    |
|---------------------------------------------------------------------------|---------------------------------------------------------------------|
| [`Build123dText`](#ducpy.search.search_build123d.Build123dText)           | Searchable text extracted from one or more build123d-backed models. |

## Functions

| [`build123d_available`](#ducpy.search.search_build123d.build123d_available)(→ bool)                              | Return whether build123d can be imported.                            |
|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| [`extract_build123d_shape_text`](#ducpy.search.search_build123d.extract_build123d_shape_text)() → Build123dText) | Extract labels/materials/joints from loaded shapes and viewer names. |
| [`extract_build123d_path_text`](#ducpy.search.search_build123d.extract_build123d_path_text)(→ Build123dText)     | Extract semantic text from a STEP/STP or STL path.                   |
| [`extract_build123d_text`](#ducpy.search.search_build123d.extract_build123d_text)(→ Build123dText)               | Extract semantic build123d-backed text from in-memory file data.     |
| [`extract_model_build123d_text`](#ducpy.search.search_build123d.extract_model_build123d_text)(→ Build123dText)   | Extract semantic text from a DUC build123d model element.            |

## Module Contents

### *class* ducpy.search.search_build123d.Build123dTextItem

One semantic text value extracted from a build123d-backed model.

#### text *: str*

#### kind *: str*

#### owner *: str | None* *= None*

#### field *: str | None* *= None*

### *class* ducpy.search.search_build123d.Build123dText

Searchable text extracted from one or more build123d-backed models.

#### items *: tuple[[Build123dTextItem](#ducpy.search.search_build123d.Build123dTextItem), Ellipsis]* *= ()*

#### *property* text *: str*

#### texts_by_kind(kind: str) → list[str]

### ducpy.search.search_build123d.build123d_available() → bool

Return whether build123d can be imported.

### ducpy.search.search_build123d.extract_build123d_shape_text(shape: Any | Sequence[Any], , viewer_names: Sequence[str] = ()) → [Build123dText](#ducpy.search.search_build123d.Build123dText)

Extract labels/materials/joints from loaded shapes and viewer names.

### ducpy.search.search_build123d.extract_build123d_path_text(path: str | pathlib.Path, model_type: str | None = None) → [Build123dText](#ducpy.search.search_build123d.Build123dText)

Extract semantic text from a STEP/STP or STL path.

### ducpy.search.search_build123d.extract_build123d_text(data: bytes, model_type: str) → [Build123dText](#ducpy.search.search_build123d.Build123dText)

Extract semantic build123d-backed text from in-memory file data.

### ducpy.search.search_build123d.extract_model_build123d_text(duc_source: str | pathlib.Path, element: dict[str, Any], , run_code: bool = False) → [Build123dText](#ducpy.search.search_build123d.Build123dText)

Extract semantic text from a DUC build123d model element.

`run_code=True` executes arbitrary embedded Python in-process and must only
be used for trusted DUC files. Source code and execution output are never
indexed.
