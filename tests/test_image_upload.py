from io import BytesIO
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest

from app.exceptions import NoteIndexError
from app.main import app
from app.ocr_service import EmptyImageError, NoTextDetectedError, OcrExtractionError

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_analyze_note(title: str, content: str) -> SimpleNamespace:
        return SimpleNamespace(
            category="Images",
            tags=["ocr", "screenshot"],
            summary=f"Summary for {title}",
        )

    def fake_extract_text(image_bytes: bytes) -> str:
        return "Receipt total: 42.50"

    monkeypatch.setattr("app.crud.ai_service.analyze_note", fake_analyze_note)
    monkeypatch.setattr("app.crud.semantic_search.index_note", lambda note: None)
    monkeypatch.setattr("app.main.extract_text_from_image", fake_extract_text)


def test_upload_image_creates_analyzed_note() -> None:
    response = client.post(
        "/upload/image",
        files={"file": ("receipt.png", BytesIO(b"\x89PNG\r\n\x1a\nfake"), "image/png")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "receipt"
    assert body["content"] == "Receipt total: 42.50"
    assert body["category"] == "Images"
    assert body["tags"] == ["ocr", "screenshot"]


def test_upload_image_rejects_unsupported_format() -> None:
    response = client.post(
        "/upload/image",
        files={"file": ("notes.gif", BytesIO(b"GIF89a"), "image/gif")},
    )

    assert response.status_code == 400
    assert "PNG, JPG, JPEG, WEBP" in response.json()["detail"]


def test_upload_image_rejects_empty_image() -> None:
    response = client.post(
        "/upload/image",
        files={"file": ("empty.png", BytesIO(b""), "image/png")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Empty image"


def test_upload_image_rejects_no_text(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.main.extract_text_from_image",
        lambda image_bytes: (_ for _ in ()).throw(NoTextDetectedError("No text detected in image")),
    )

    response = client.post(
        "/upload/image",
        files={"file": ("blank.png", BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "No text detected in image"


def test_upload_image_rejects_ocr_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.main.extract_text_from_image",
        lambda image_bytes: (_ for _ in ()).throw(OcrExtractionError("OCR extraction failed")),
    )

    response = client.post(
        "/upload/image",
        files={"file": ("broken.png", BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "OCR extraction failed"


def test_upload_image_rejects_oversized_file(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.main.MAX_IMAGE_BYTES", 10)

    response = client.post(
        "/upload/image",
        files={"file": ("big.png", BytesIO(b"\x89PNG\r\n\x1a\n" + b"x" * 20), "image/png")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Image exceeds maximum size"


def test_upload_image_returns_503_when_ollama_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    def failing_analyze_note(title: str, content: str) -> SimpleNamespace:
        raise ValueError("Ollama returned invalid JSON for note analysis")

    monkeypatch.setattr("app.crud.ai_service.analyze_note", failing_analyze_note)

    response = client.post(
        "/upload/image",
        files={"file": ("shot.png", BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "AI analysis unavailable"


def test_upload_image_returns_503_when_embedding_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    def failing_index(note: SimpleNamespace) -> None:
        raise NoteIndexError("Failed to index note for search")

    monkeypatch.setattr("app.crud.semantic_search.index_note", failing_index)

    response = client.post(
        "/upload/image",
        files={"file": ("shot.png", BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Failed to index note for search"
