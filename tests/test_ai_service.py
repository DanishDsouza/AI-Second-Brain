import pytest

from app.ai_service import NoteAnalysis, _content_for_analysis, _parse_analysis
from app.config import MAX_ANALYSIS_CONTENT_CHARS


def test_parse_analysis() -> None:
    analysis = _parse_analysis(
        '{"category": "Work", "tags": ["planning", "api"], "summary": "Build the API."}'
    )

    assert analysis == NoteAnalysis(
        category="Work",
        tags=["planning", "api"],
        summary="Build the API.",
    )


def test_parse_analysis_rejects_invalid_json() -> None:
    with pytest.raises(ValueError, match="invalid JSON"):
        _parse_analysis("not json")


def test_parse_analysis_rejects_incomplete_analysis() -> None:
    with pytest.raises(ValueError, match="incomplete"):
        _parse_analysis('{"category": "Work"}')


def test_content_for_analysis_keeps_short_text_unchanged() -> None:
    content = "short note body"

    assert _content_for_analysis(content) == content


def test_content_for_analysis_truncates_long_text_for_ollama_only() -> None:
    full_content = "a" * (MAX_ANALYSIS_CONTENT_CHARS + 500)
    excerpt = _content_for_analysis(full_content)

    assert len(full_content) > MAX_ANALYSIS_CONTENT_CHARS
    assert excerpt.startswith("a" * MAX_ANALYSIS_CONTENT_CHARS)
    assert "truncated for analysis" in excerpt
    assert len(excerpt) < len(full_content)
