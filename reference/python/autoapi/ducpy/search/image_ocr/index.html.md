# ducpy.search.image_ocr

Server-side image OCR helpers for DUC search.

Uses `rapidocr-onnxruntime` with custom PP-OCRv6_tiny ONNX models when the `ocr` extra is installed, otherwise
OCR is gracefully skipped.

## Attributes

| [`logger`](#ducpy.search.image_ocr.logger)                                             |    |
|----------------------------------------------------------------------------------------|----|
| [`_RAPID_OCR_ENGINE`](#ducpy.search.image_ocr._RAPID_OCR_ENGINE)                       |    |
| [`_server_side_ocr_available`](#ducpy.search.image_ocr._server_side_ocr_available)     |    |
| [`_extract_image_text_with_ocr`](#ducpy.search.image_ocr._extract_image_text_with_ocr) |    |

## Functions

| [`server_side_ocr_available`](#ducpy.search.image_ocr.server_side_ocr_available)(→ bool)                 | Return whether the `ocr` extra (RapidOCR) is installed and usable.   |
|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| [`_get_local_cache_dir`](#ducpy.search.image_ocr._get_local_cache_dir)(→ str | None)                     |                                                                      |
| [`_get_rapid_engine`](#ducpy.search.image_ocr._get_rapid_engine)(→ Any)                                  |                                                                      |
| [`extract_image_text_with_ocr`](#ducpy.search.image_ocr.extract_image_text_with_ocr)(→ tuple[str, bool]) | OCR an image using the `ocr` extra, or skip when unavailable.        |

## Module Contents

### ducpy.search.image_ocr.logger

### ducpy.search.image_ocr.\_RAPID_OCR_ENGINE *: Any | None* *= None*

### ducpy.search.image_ocr.server_side_ocr_available() → bool

Return whether the `ocr` extra (RapidOCR) is installed and usable.

### ducpy.search.image_ocr.\_get_local_cache_dir(repo_id: str) → str | None

### ducpy.search.image_ocr.\_get_rapid_engine() → Any

### ducpy.search.image_ocr.extract_image_text_with_ocr(image_bytes: bytes, , ocr_language: str) → tuple[str, bool]

OCR an image using the `ocr` extra, or skip when unavailable.

### ducpy.search.image_ocr.\_server_side_ocr_available

### ducpy.search.image_ocr.\_extract_image_text_with_ocr
