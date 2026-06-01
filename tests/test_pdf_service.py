import fitz
import pytest

from app.pdf_service import EmptyPdfError, PdfExtractionError, extract_text_from_pdf


def make_pdf_bytes(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


def test_extract_text_from_pdf_returns_joined_page_text() -> None:
    pdf_bytes = make_pdf_bytes("Hello from PDF")

    text = extract_text_from_pdf(pdf_bytes)

    assert "Hello from PDF" in text


def test_extract_text_from_pdf_rejects_invalid_bytes() -> None:
    with pytest.raises(PdfExtractionError, match="PDF extraction failed"):
        extract_text_from_pdf(b"not-a-pdf")


def test_extract_text_from_pdf_rejects_empty_text() -> None:
    pdf_bytes = make_pdf_bytes("")

    with pytest.raises(EmptyPdfError, match="no extractable text"):
        extract_text_from_pdf(pdf_bytes)
