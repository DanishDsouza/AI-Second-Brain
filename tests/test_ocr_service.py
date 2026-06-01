from io import BytesIO
from types import SimpleNamespace

import pytest
from PIL import Image, ImageDraw

from app.ocr_service import EmptyImageError, NoTextDetectedError, OcrExtractionError, extract_text_from_image


def make_png_bytes() -> bytes:
    image = Image.new("RGB", (200, 80), color="white")
    draw = ImageDraw.Draw(image)
    draw.text((10, 30), "Hello OCR", fill="black")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_extract_text_from_image_rejects_empty_bytes() -> None:
    with pytest.raises(EmptyImageError, match="Empty image"):
        extract_text_from_image(b"")


def test_extract_text_from_image_uses_ocr_engine(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_ocr(image_array: object) -> list:
        return [
            [
                [[[0, 0], [1, 1], [2, 2], [3, 3]], ("Line one", 0.99)],
            ]
        ]

    monkeypatch.setattr("app.ocr_service._run_ocr", fake_ocr)

    text = extract_text_from_image(make_png_bytes())

    assert text == "Line one"


def test_extract_text_from_image_raises_when_no_text(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.ocr_service._run_ocr", lambda image_array: [[]])

    with pytest.raises(NoTextDetectedError, match="No text detected"):
        extract_text_from_image(make_png_bytes())


def test_extract_text_from_image_raises_on_ocr_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    def failing_ocr(image_array: object) -> object:
        raise RuntimeError("model failed")

    monkeypatch.setattr("app.ocr_service._run_ocr", failing_ocr)

    with pytest.raises(OcrExtractionError, match="OCR extraction failed"):
        extract_text_from_image(make_png_bytes())
