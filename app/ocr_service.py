from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from functools import lru_cache
from io import BytesIO
from typing import Any

import numpy as np
from PIL import Image, UnidentifiedImageError

from app.config import MAX_IMAGE_DIMENSION, OCR_LANG, OCR_TIMEOUT_SECONDS


class OcrExtractionError(Exception):
    """Raised when OCR cannot process the image."""


class EmptyImageError(OcrExtractionError):
    """Raised when the upload is empty or not a decodable image."""


class NoTextDetectedError(OcrExtractionError):
    """Raised when OCR finds no text in the image."""


_executor = ThreadPoolExecutor(max_workers=1)


def extract_text_from_image(image_bytes: bytes) -> str:
    """Extract text from an image held in memory.

    Returns the complete string for storage in notes.content. Truncation for
    Ollama analysis and embeddings happens later, not here.
    """
    if not image_bytes:
        raise EmptyImageError("Empty image")

    try:
        image = Image.open(BytesIO(image_bytes))
        image.load()
    except UnidentifiedImageError as error:
        raise EmptyImageError("Empty image") from error
    except Exception as error:
        raise OcrExtractionError("OCR extraction failed") from error

    image = image.convert("RGB")
    image = _resize_if_needed(image)
    image_array = np.array(image)

    try:
        ocr_result = _executor.submit(_run_ocr, image_array).result(timeout=OCR_TIMEOUT_SECONDS)
    except FuturesTimeoutError as error:
        raise OcrExtractionError("OCR extraction failed") from error
    except Exception as error:
        raise OcrExtractionError("OCR extraction failed") from error

    text = _lines_from_ocr_result(ocr_result).strip()
    if not text:
        raise NoTextDetectedError("No text detected in image")

    return text


@lru_cache(maxsize=1)
def _get_ocr_engine() -> Any:
    from paddleocr import PaddleOCR

    return PaddleOCR(use_angle_cls=True, lang=OCR_LANG, show_log=False)


def _run_ocr(image_array: np.ndarray) -> Any:
    return _get_ocr_engine().ocr(image_array, cls=True)


def _resize_if_needed(image: Image.Image) -> Image.Image:
    width, height = image.size
    longest_side = max(width, height)
    if longest_side <= MAX_IMAGE_DIMENSION:
        return image

    scale = MAX_IMAGE_DIMENSION / longest_side
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def _lines_from_ocr_result(ocr_result: Any) -> str:
    if not ocr_result:
        return ""

    lines: list[str] = []
    for page in ocr_result:
        if not page:
            continue
        for line in page:
            if not line or len(line) < 2:
                continue
            text = line[1][0]
            if text and text.strip():
                lines.append(text.strip())

    return "\n".join(lines)
