import pytest

from app.ai_service import NoteAnalysis, _parse_analysis


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
