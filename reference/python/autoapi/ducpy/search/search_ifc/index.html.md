# ducpy.search.search_ifc

IFC text extraction for model-element search (the IfcOpenShell engine).

The extractor indexes values that exist in the IFC model itself: human-facing
entity attributes, properties, quantities, materials, classifications,
documents, presentation-layer names, addresses, actors, and selected file-header
metadata. It does not index raw STEP records, IFC entity class names, generated
GlobalIds, or embedded Python source.

Linked IFC files are searched by default. Trusted Python model code can be
executed explicitly to capture IfcOpenShell files it opens or creates.

## Classes

| [`IfcTextItem`](#ducpy.search.search_ifc.IfcTextItem)   | A searchable value read from a specific IFC entity attribute.     |
|---------------------------------------------------------|-------------------------------------------------------------------|
| [`IfcText`](#ducpy.search.search_ifc.IfcText)           | Result of extracting user-facing text from one or more IFC files. |

## Functions

| [`ifcopenshell_available`](#ducpy.search.search_ifc.ifcopenshell_available)(→ bool)    | Return whether IfcOpenShell can be imported.                            |
|----------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| [`extract_ifc_file_text`](#ducpy.search.search_ifc.extract_ifc_file_text)(→ IfcText)   | Extract searchable values from a loaded IfcOpenShell file.              |
| [`extract_ifc_text`](#ducpy.search.search_ifc.extract_ifc_text)(→ IfcText)             | Parse IFC STEP bytes and extract searchable values, or return empty.    |
| [`extract_ifc_path_text`](#ducpy.search.search_ifc.extract_ifc_path_text)(→ IfcText)   | Open and extract an IFC file from disk without first reading its bytes. |
| [`extract_model_ifc_text`](#ducpy.search.search_ifc.extract_model_ifc_text)(→ IfcText) | Extract searchable values from a DUC IFC model element.                 |

## Module Contents

### *class* ducpy.search.search_ifc.IfcTextItem

A searchable value read from a specific IFC entity attribute.

#### text *: str*

#### kind *: str*

#### entity_type *: str | None* *= None*

#### entity_id *: int | None* *= None*

#### field *: str | None* *= None*

### *class* ducpy.search.search_ifc.IfcText

Result of extracting user-facing text from one or more IFC files.

#### items *: tuple[[IfcTextItem](#ducpy.search.search_ifc.IfcTextItem), Ellipsis]* *= ()*

#### *property* text *: str*

#### texts_by_kind(kind: str) → list[str]

### ducpy.search.search_ifc.ifcopenshell_available() → bool

Return whether IfcOpenShell can be imported.

### ducpy.search.search_ifc.extract_ifc_file_text(model: Any) → [IfcText](#ducpy.search.search_ifc.IfcText)

Extract searchable values from a loaded IfcOpenShell file.

### ducpy.search.search_ifc.extract_ifc_text(ifc_bytes: bytes) → [IfcText](#ducpy.search.search_ifc.IfcText)

Parse IFC STEP bytes and extract searchable values, or return empty.

### ducpy.search.search_ifc.extract_ifc_path_text(path: str | pathlib.Path) → [IfcText](#ducpy.search.search_ifc.IfcText)

Open and extract an IFC file from disk without first reading its bytes.

### ducpy.search.search_ifc.extract_model_ifc_text(duc_source: str | pathlib.Path, element: dict[str, Any], , run_code: bool = False) → [IfcText](#ducpy.search.search_ifc.IfcText)

Extract searchable values from a DUC IFC model element.

Linked files are read without code execution. Enabling run_code executes
trusted Python/IfcOpenShell code in-process and indexes only values that are
materialized into captured IFC entities. Python source itself is not searched.
