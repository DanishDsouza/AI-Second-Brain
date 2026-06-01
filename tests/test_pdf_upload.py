from io import BytesIO
from types import SimpleNamespace

import fitz
from fastapi.testclient import TestClient
import pytest

from app.exceptions import NoteIndexError
from app.main import app
from app.pdf_service import EmptyPdfError, PdfExtractionError

client = TestClient(app)


def make_pdf_bytes(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_analyze_note(title: str, content: str) -> SimpleNamespace:
        return SimpleNamespace(
            category="Documents",
            tags=["pdf"],
            summary=f"Summary for {title}",
        )

    monkeypatch.setattr("app.crud.ai_service.analyze_note", fake_analyze_note)
    monkeypatch.setattr("app.crud.semantic_search.index_note", lambda note: None)


def test_upload_pdf_creates_analyzed_note() -> None:
    pdf_bytes = make_pdf_bytes("Quarterly report content")

    response = client.post(
        "/upload/pdf",
        files={"file": ("report.pdf", BytesIO(pdf_bytes), "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "report"
    assert "Quarterly report content" in body["content"]
    assert body["category"] == "Documents"
    assert body["tags"] == ["pdf"]
    assert body["summary"] == "Summary for report"


def test_upload_pdf_rejects_non_pdf() -> None:
    response = client.post(
        "/upload/pdf",
        files={"file": ("notes.txt", BytesIO(b"plain text"), "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid file type; PDF required"


def test_upload_pdf_rejects_empty_extracted_text(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.main.extract_text_from_pdf",
        lambda pdf_bytes: (_ for _ in ()).throw(EmptyPdfError("PDF contains no extractable text")),
    )

    response = client.post(
        "/upload/pdf",
        files={"file": ("blank.pdf", BytesIO(make_pdf_bytes("ignored")), "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "PDF contains no extractable text"


def test_upload_pdf_rejects_extraction_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.main.extract_text_from_pdf",
        lambda pdf_bytes: (_ for _ in ()).throw(PdfExtractionError("PDF extraction failed")),
    )

    response = client.post(
        "/upload/pdf",
        files={"file": ("broken.pdf", BytesIO(b"%PDF-broken"), "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "PDF extraction failed"


def test_upload_pdf_rejects_oversized_file(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.main.MAX_PDF_BYTES", 10)

    response = client.post(
        "/upload/pdf",
        files={"file": ("large.pdf", BytesIO(make_pdf_bytes("too big")), "application/pdf")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "PDF exceeds maximum size"


def test_upload_pdf_rejects_too_much_extracted_text(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.main.MAX_NOTE_CONTENT_CHARS", 5)
    monkeypatch.setattr("app.main.extract_text_from_pdf", lambda pdf_bytes: "abcdefgh")

    response = client.post(
        "/upload/pdf",
        files={"file": ("long.pdf", BytesIO(make_pdf_bytes("ignored")), "application/pdf")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Extracted text exceeds maximum length"


def test_upload_pdf_returns_503_when_ollama_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    def failing_analyze_note(title: str, content: str) -> SimpleNamespace:
        raise ValueError("Ollama returned invalid JSON for note analysis")

    monkeypatch.setattr("app.crud.ai_service.analyze_note", failing_analyze_note)

    response = client.post(
        "/upload/pdf",
        files={"file": ("doc.pdf", BytesIO(make_pdf_bytes("content")), "application/pdf")},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "AI analysis unavailable"


def test_upload_pdf_returns_503_when_embedding_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    def failing_index(note: SimpleNamespace) -> None:
        raise NoteIndexError("Failed to index note for search")

    monkeypatch.setattr("app.crud.semantic_search.index_note", failing_index)

    response = client.post(
        "/upload/pdf",
        files={"file": ("doc.pdf", BytesIO(make_pdf_bytes("content")), "application/pdf")},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Failed to index note for search"
