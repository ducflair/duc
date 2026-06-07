"""Server-side image OCR helpers for DUC search.

Uses ``rapidocr-onnxruntime`` when the ``ocr`` extra is installed, otherwise
OCR is gracefully skipped.
"""

from __future__ import annotations

import io
import logging
from functools import lru_cache
from typing import Any

logger = logging.getLogger(__name__)

_RAPID_OCR_ENGINE: Any | None = None


@lru_cache(maxsize=1)
def server_side_ocr_available() -> bool:
    """Return whether the ``ocr`` extra (RapidOCR) is installed and usable."""

    try:
        from rapidocr_onnxruntime import RapidOCR  # type: ignore
        from PIL import Image  # type: ignore  # noqa: F401
    except Exception as exc:
        logger.debug("OCR extra (rapidocr-onnxruntime) unavailable: %s", exc)
        return False

    return True


def _get_rapid_engine() -> Any:
    global _RAPID_OCR_ENGINE
    if _RAPID_OCR_ENGINE is None:
        from rapidocr_onnxruntime import RapidOCR  # type: ignore

        _RAPID_OCR_ENGINE = RapidOCR()
    return _RAPID_OCR_ENGINE


def extract_image_text_with_ocr(image_bytes: bytes, *, ocr_language: str) -> tuple[str, bool]:
    """OCR an image using the ``ocr`` extra, or skip when unavailable."""

    if not server_side_ocr_available():
        return "", False

    try:
        import numpy as np  # type: ignore
        from PIL import Image  # type: ignore
    except Exception as exc:
        logger.debug("Image OCR dependencies unavailable: %s", exc)
        return "", False

    try:
        with Image.open(io.BytesIO(image_bytes)) as image_obj:
            image_input = np.array(image_obj.convert("RGB"))

        engine = _get_rapid_engine()
        result, _elapsed = engine(image_input)
        if not result:
            return "", False

        lines: list[str] = []
        for row in result:
            if isinstance(row, (tuple, list)) and len(row) >= 2:
                value = str(row[1] or "").strip()
                if value:
                    lines.append(value)
        text = "\n".join(lines)
    except Exception as exc:
        logger.debug("Failed to OCR image bytes: %s", exc)
        return "", False

    return text, bool(text)


_server_side_ocr_available = server_side_ocr_available
_extract_image_text_with_ocr = extract_image_text_with_ocr