"""Server-side image OCR helpers for DUC search.

Uses ``rapidocr-onnxruntime`` with custom PP-OCRv6_tiny ONNX models when the ``ocr`` extra is installed, otherwise
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
        from rapidocr import RapidOCR  # type: ignore
        from huggingface_hub import snapshot_download  # type: ignore # noqa: F401
        from PIL import Image  # type: ignore  # noqa: F401
    except Exception as exc:
        logger.debug("OCR extra (rapidocr/huggingface-hub) unavailable: %s", exc)
        return False

    return True


def _get_local_cache_dir(repo_id: str) -> str | None:
    import os
    folder_name = "models--" + repo_id.replace("/", "--")
    cache_dir = os.environ.get("HF_HUB_CACHE")
    if not cache_dir:
        hf_home = os.environ.get("HF_HOME")
        if hf_home:
            cache_dir = os.path.join(hf_home, "hub")
        else:
            cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
    
    repo_dir = os.path.join(cache_dir, folder_name)
    if not os.path.isdir(repo_dir):
        return None
        
    # Read refs/main if it exists to get the current commit snapshot
    refs_main = os.path.join(repo_dir, "refs", "main")
    if os.path.isfile(refs_main):
        try:
            with open(refs_main, "r", encoding="utf-8") as f:
                commit_hash = f.read().strip()
            snapshot_dir = os.path.join(repo_dir, "snapshots", commit_hash)
            if os.path.isdir(snapshot_dir):
                return snapshot_dir
        except Exception:
            pass
            
    # Fallback to the latest folder in snapshots/
    snapshots_dir = os.path.join(repo_dir, "snapshots")
    if os.path.isdir(snapshots_dir):
        try:
            subdirs = [os.path.join(snapshots_dir, d) for d in os.listdir(snapshots_dir)]
            subdirs = [d for d in subdirs if os.path.isdir(d)]
            if subdirs:
                return max(subdirs, key=os.path.getmtime)
        except Exception:
            pass
            
    return None


def _get_rapid_engine() -> Any:
    global _RAPID_OCR_ENGINE
    if _RAPID_OCR_ENGINE is None:
        from rapidocr import RapidOCR  # type: ignore
        from rapidocr.utils.typings import EngineType  # type: ignore
        import os
        import yaml

        # Try to resolve cache locally first to avoid snapshot_download overhead (0.1ms vs 180ms)
        det_dir = _get_local_cache_dir("PaddlePaddle/PP-OCRv6_tiny_det_onnx")
        rec_dir = _get_local_cache_dir("PaddlePaddle/PP-OCRv6_tiny_rec_onnx")

        # Fallback to snapshot_download if local files aren't fully resolved
        if (
            not det_dir
            or not rec_dir
            or not os.path.exists(os.path.join(det_dir, "inference.onnx"))
            or not os.path.exists(os.path.join(rec_dir, "inference.onnx"))
        ):
            from huggingface_hub import snapshot_download  # type: ignore
            try:
                det_dir = snapshot_download("PaddlePaddle/PP-OCRv6_tiny_det_onnx", local_files_only=True)
                rec_dir = snapshot_download("PaddlePaddle/PP-OCRv6_tiny_rec_onnx", local_files_only=True)
            except Exception:
                det_dir = snapshot_download("PaddlePaddle/PP-OCRv6_tiny_det_onnx")
                rec_dir = snapshot_download("PaddlePaddle/PP-OCRv6_tiny_rec_onnx")

        det_model = os.path.join(det_dir, "inference.onnx")
        rec_model = os.path.join(rec_dir, "inference.onnx")

        # Load the dictionary from the model config to prevent IndexError
        dict_path = os.path.join(rec_dir, "ppocrv6_keys.txt")
        if not os.path.exists(dict_path):
            yml_path = os.path.join(rec_dir, "inference.yml")
            try:
                with open(yml_path, "r", encoding="utf-8") as f:
                    cfg = yaml.safe_load(f)
                char_list = cfg["PostProcess"]["character_dict"]
                with open(dict_path, "w", encoding="utf-8") as f:
                    for char in char_list:
                        f.write(char + "\n")
            except Exception as e:
                logger.debug("Failed to extract character_dict from inference.yml: %s", e)
                # Fallback to the en_dict.txt shipped in the repository if yaml parsing fails
                dict_path = os.path.join(rec_dir, "en_dict.txt")

        _RAPID_OCR_ENGINE = RapidOCR(
            params={
                "Global.use_cls": False,

                "Det.model_path": det_model,
                "Det.engine_type": EngineType.ONNXRUNTIME,

                "Rec.model_path": rec_model,
                "Rec.rec_keys_path": dict_path,
                "Rec.engine_type": EngineType.ONNXRUNTIME,
            }
        )
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
        raw_res = engine(image_input)

        if hasattr(raw_res, "txts"):
            txts = raw_res.txts
        elif isinstance(raw_res, tuple) and len(raw_res) == 2:
            result, _ = raw_res
            if hasattr(result, "txts"):
                txts = result.txts
            elif isinstance(result, (list, tuple)):
                txts = [row[1] for row in result if isinstance(row, (tuple, list)) and len(row) >= 2]
            else:
                txts = None
        elif isinstance(raw_res, (list, tuple)):
            txts = [row[1] for row in raw_res if isinstance(row, (tuple, list)) and len(row) >= 2]
        else:
            txts = None

        if not txts:
            return "", False

        lines: list[str] = []
        for txt in txts:
            value = str(txt or "").strip()
            if value:
                lines.append(value)
        text = "\n".join(lines)
    except Exception as exc:
        logger.debug("Failed to OCR image bytes: %s", exc)
        return "", False

    return text, bool(text)


_server_side_ocr_available = server_side_ocr_available
_extract_image_text_with_ocr = extract_image_text_with_ocr