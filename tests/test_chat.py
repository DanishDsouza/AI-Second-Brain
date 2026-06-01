from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest

from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_analyze_note(title: str, content: str) -> SimpleNamespace:
        return SimpleNamespace(
            category="General",
            tags=["test"],
            summary=f"Summary for {title}",
        )

    monkeypatch.setattr("app.crud.ai_service.analyze_note", fake_analyze_note)
    monkeypatch.setattr("app.crud.semantic_search.index_note", lambda note: None)


def test_chat_returns_answer_and_sources(monkeypatch: pytest.MonkeyPatch) -> None:
    created = client.post("/notes", json={"title": "API Guide", "content": "FastAPI tutorial"}).json()

    monkeypatch.setattr(
        "app.rag_service.semantic_search.search_note_ids",
        lambda query, limit: [created["id"]],
    )
    monkeypatch.setattr(
        "app.rag_service.ai_service.generate_chat_answer",
        lambda question, context: f"Answer about {question} using note {created['id']}",
    )

    response = client.post("/chat", json={"question": "How do I build an API?"})

    assert response.status_code == 200
    body = response.json()
    assert "API" in body["answer"]
    assert body["sources"] == [{"id": created["id"], "title": "API Guide"}]


def test_chat_with_no_relevant_notes_skips_ollama(monkeypatch: pytest.MonkeyPatch) -> None:
    called = {"chat": False}

    def fail_chat(*args: object, **kwargs: object) -> str:
        called["chat"] = True
        raise AssertionError("Ollama should not be called")

    monkeypatch.setattr("app.rag_service.semantic_search.search_note_ids", lambda query, limit: [])
    monkeypatch.setattr("app.rag_service.ai_service.generate_chat_answer", fail_chat)

    response = client.post("/chat", json={"question": "Unknown topic"})

    assert response.status_code == 200
    assert response.json()["sources"] == []
    assert "could not find" in response.json()["answer"].lower()
    assert called["chat"] is False


def test_chat_retrieves_top_eight(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, int] = {}

    def capture_search(query: str, limit: int) -> list[int]:
        captured["limit"] = limit
        return []

    monkeypatch.setattr("app.rag_service.semantic_search.search_note_ids", capture_search)

    client.post("/chat", json={"question": "test"})

    assert captured["limit"] == 8


def test_chat_requires_question() -> None:
    response = client.post("/chat", json={"question": ""})

    assert response.status_code == 422


def test_chat_returns_503_when_ollama_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    created = client.post("/notes", json={"title": "Note", "content": "Body"}).json()

    monkeypatch.setattr(
        "app.rag_service.semantic_search.search_note_ids",
        lambda query, limit: [created["id"]],
    )

    def failing_chat(question: str, context: str) -> str:
        raise ValueError("Ollama returned an empty chat response")

    monkeypatch.setattr("app.rag_service.ai_service.generate_chat_answer", failing_chat)

    response = client.post("/chat", json={"question": "What is this?"})

    assert response.status_code == 503
    assert response.json()["detail"] == "AI chat unavailable"
