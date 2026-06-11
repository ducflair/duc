"""PDF text extraction for search."""

from __future__ import annotations

import io
import logging

from .image_ocr import extract_image_text_with_ocr, server_side_ocr_available

logger = logging.getLogger(__name__)


def _compress_whitespace(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(str(value).split())


def extract_pdf_text_for_search(
    pdf_bytes: bytes,
    *,
    ocr_language: str,
) -> tuple[str, tuple[tuple[int, int, int], ...], bool]:
    try:
        from pypdf import PdfReader
    except Exception as exc:
        logger.debug("PDF search dependencies unavailable: %s", exc)
        return "", (), False

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as exc:
        logger.debug("Failed to parse PDF bytes for search: %s", exc)
        return "", (), False

    use_embedded_image_ocr = server_side_ocr_available()
    text_parts: list[str] = []
    page_spans: list[tuple[int, int, int]] = []
    used_ocr = False
    cursor = 0

    for page_index, page in enumerate(reader.pages):
        page_number = page_index + 1
        try:
            plain_text = _compress_whitespace(page.extract_text() or "")
        except Exception as exc:
            logger.debug("Failed to extract PDF page text %s: %s", page_index, exc)
            plain_text = ""

        page_parts: list[str] = []
        if plain_text:
            page_parts.append(plain_text)

        if use_embedded_image_ocr:
            try:
                for image_file in page.images:
                    try:
                        pil_image = image_file.image
                    except Exception:
                        pil_image = None
                    if pil_image is None:
                        continue
                    try:
                        img_buffer = io.BytesIO()
                        pil_image.save(img_buffer, format="PNG")
                        ocr_text, has_ocr_text = extract_image_text_with_ocr(
                            img_buffer.getvalue(),
                            ocr_language=ocr_language,
                        )
                    except Exception:
                        ocr_text = ""
                        has_ocr_text = False
                    ocr_text = _compress_whitespace(ocr_text)
                    if has_ocr_text and ocr_text:
                        page_parts.append(ocr_text)
                        used_ocr = True
            except Exception as exc:
                logger.debug("Failed to OCR embedded PDF images on page %s: %s", page_index, exc)

        page_text = " ".join(part for part in page_parts if part)
        if not page_text:
            continue

        if text_parts:
            text_parts.append(" ")
            cursor += 1
        start = cursor
        text_parts.append(page_text)
        cursor += len(page_text)
        page_spans.append((page_number, start, cursor))

    if not text_parts:
        return "", (), used_ocr

    return "".join(text_parts), tuple(page_spans), used_ocr
