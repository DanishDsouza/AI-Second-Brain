class PdfExtractionError(Exception):
    """Raised when PDF bytes cannot be parsed."""


class EmptyPdfError(PdfExtractionError):
    """Raised when a PDF has no extractable text."""


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all page text from a PDF held in memory.

    Returns the complete string for storage in notes.content. Truncation for
    Ollama analysis happens later in ai_service._content_for_analysis, not here.
    """
    import fitz

    try:
        document = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as error:
        raise PdfExtractionError("PDF extraction failed") from error

    try:
        page_texts = [page.get_text() for page in document]
    finally:
        document.close()

    text = "\n\n".join(page_texts).strip()
    if not text:
        raise EmptyPdfError("PDF contains no extractable text")

    return text
