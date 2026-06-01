from types import SimpleNamespace

from app import rag_service


def test_build_context_respects_max_chars(monkeypatch) -> None:
    monkeypatch.setattr(rag_service, "RAG_MAX_CONTEXT_CHARS", 200)
    monkeypatch.setattr(rag_service, "RAG_EXCERPT_CHARS", 100)

    notes = [
        SimpleNamespace(
            id=1,
            title="First",
            category="A",
            tags=["one"],
            summary="Sum one",
            content="x" * 500,
        ),
        SimpleNamespace(
            id=2,
            title="Second",
            category="B",
            tags=[],
            summary="Sum two",
            content="y" * 500,
        ),
    ]

    context = rag_service._build_context(notes)

    assert len(context) <= 200
    assert "Note id=1" in context
