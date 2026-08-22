# ducpy.search.search_ezdxf

DXF text extraction for model-element search (the `ezdxf` engine).

This module pulls **user-authored text** out of a DXF drawing — the things a
person types as drawing content rather than the surrounding Python that loads
or builds the drawing. Per the agreed scope we “extract everything”:

* annotation text — `TEXT`, `MTEXT`, block attributes (`ATTRIB` /
  `ATTDEF`), `DIMENSION` text overrides, `MULTILEADER` / `LEADER` notes,
  and `ACAD_TABLE` cells;
* structural names — layer, block and layout names;
* extended data — entity hyperlinks, `XDATA` strings and custom drawing
  properties.

Acquisition searches linked DXF/DWG files by default. For trusted DUC files,
[`extract_model_dxf_text()`](#ducpy.search.search_ezdxf.extract_model_dxf_text) can opt into embedded Python execution to capture
generated entities such as `msp.add_text("Room 101")`.

DWG is converted to DXF by [`convert_dwg_to_dxf()`](#ducpy.search.search_ezdxf.convert_dwg_to_dxf), using the standalone
Rust/wasm-bindgen module published by `dwgdxf` 2.0.1 and executed directly
from Python with `wasmtime`.

## Attributes

| [`DWGDXF_WASM_URL`](#ducpy.search.search_ezdxf.DWGDXF_WASM_URL)           |    |
|---------------------------------------------------------------------------|----|
| [`DWGDXF_WASM_PATH_ENV`](#ducpy.search.search_ezdxf.DWGDXF_WASM_PATH_ENV) |    |

## Exceptions

| [`DwgConversionNotAvailable`](#ducpy.search.search_ezdxf.DwgConversionNotAvailable)   | Raised when the DWG WASM converter cannot be loaded or executed.   |
|---------------------------------------------------------------------------------------|--------------------------------------------------------------------|

## Classes

| [`DxfTextItem`](#ducpy.search.search_ezdxf.DxfTextItem)   | A single piece of text pulled from a drawing, with its provenance.   |
|-----------------------------------------------------------|----------------------------------------------------------------------|
| [`DxfText`](#ducpy.search.search_ezdxf.DxfText)           | Result of extracting text from one or more drawings.                 |

## Functions

| [`ezdxf_available`](#ducpy.search.search_ezdxf.ezdxf_available)(→ bool)                  | Return `True` if the optional `ezdxf` dependency can be imported.   |
|------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| [`extract_drawing_text`](#ducpy.search.search_ezdxf.extract_drawing_text)(→ DxfText)     | Extract every piece of user text from an in-memory `ezdxf` drawing. |
| [`extract_dxf_text`](#ducpy.search.search_ezdxf.extract_dxf_text)(→ DxfText)             | Extract user text from raw DXF bytes. Returns empty on any failure. |
| [`convert_dwg_to_dxf`](#ducpy.search.search_ezdxf.convert_dwg_to_dxf)(→ bytes)           | Convert DWG bytes to DXF bytes.                                     |
| [`extract_model_dxf_text`](#ducpy.search.search_ezdxf.extract_model_dxf_text)(→ DxfText) | Hybrid extraction of user text from an `ezdxf` model element.       |

## Module Contents

### ducpy.search.search_ezdxf.DWGDXF_WASM_URL *= 'https://cdn.jsdelivr.net/npm/dwgdxf@2.0.1/dist/wasm/dwgdxf_bg.wasm'*

### ducpy.search.search_ezdxf.DWGDXF_WASM_PATH_ENV *= 'DUCPY_DWGDXF_WASM_PATH'*

### *exception* ducpy.search.search_ezdxf.DwgConversionNotAvailable

Bases: `RuntimeError`

Raised when the DWG WASM converter cannot be loaded or executed.

Initialize self.  See help(type(self)) for accurate signature.

### *class* ducpy.search.search_ezdxf.DxfTextItem

A single piece of text pulled from a drawing, with its provenance.

#### text *: str*

#### kind *: str*

#### owner *: str | None* *= None*

#### layer *: str | None* *= None*

### *class* ducpy.search.search_ezdxf.DxfText

Result of extracting text from one or more drawings.

#### items *: tuple[[DxfTextItem](#ducpy.search.search_ezdxf.DxfTextItem), Ellipsis]* *= ()*

#### *property* text *: str*

All item texts joined with newlines (handy for a quick search blob).

#### texts_by_kind(kind: str) → list[str]

### ducpy.search.search_ezdxf.ezdxf_available() → bool

Return `True` if the optional `ezdxf` dependency can be imported.

### ducpy.search.search_ezdxf.extract_drawing_text(doc: Any) → [DxfText](#ducpy.search.search_ezdxf.DxfText)

Extract every piece of user text from an in-memory `ezdxf` drawing.

### ducpy.search.search_ezdxf.extract_dxf_text(dxf_bytes: bytes) → [DxfText](#ducpy.search.search_ezdxf.DxfText)

Extract user text from raw DXF bytes. Returns empty on any failure.

### ducpy.search.search_ezdxf.convert_dwg_to_dxf(dwg_bytes: bytes, , wasm_path: str | pathlib.Path | None = None, wasm_url: str = DWGDXF_WASM_URL, timeout_seconds: float = 30.0) → bytes

Convert DWG bytes to DXF bytes.

By default the pinned `dwgdxf` 2.0.1 module is downloaded from
[`DWGDXF_WASM_URL`](#ducpy.search.search_ezdxf.DWGDXF_WASM_URL), verified against its published SHA-256 digest,
and cached under the system temporary directory. Pass `wasm_path` or set
[`DWGDXF_WASM_PATH_ENV`](#ducpy.search.search_ezdxf.DWGDXF_WASM_PATH_ENV) to use an already-downloaded copy; local copies
are still integrity checked.

### ducpy.search.search_ezdxf.extract_model_dxf_text(duc_source: str | pathlib.Path, element: dict[str, Any], , run_code: bool = False) → [DxfText](#ducpy.search.search_ezdxf.DxfText)

Hybrid extraction of user text from an `ezdxf` model element.

Linked DXF/DWG files are searched without executing code. If `run_code` is
explicitly enabled, trusted Python model code is executed and text is read
from the resulting drawing(s), including generated entities such as
`add_text("Room 101")`. Never enable this for untrusted DUC files.
