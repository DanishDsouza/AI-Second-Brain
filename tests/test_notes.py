from collections.abc import Generator
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_analyze_note(title: str, content: str) -> SimpleNamespace:
        return SimpleNamespace(
            category="General",
            tags=["test", "note"],
            summary=f"Summary for {title}",
        )

    monkeypatch.setattr("app.crud.ai_service.analyze_note", fake_analyze_note)
    monkeypatch.setattr("app.crud.semantic_search.index_note", lambda note: None)
    monkeypatch.setattr("app.crud.semantic_search.delete_note", lambda note_id: None)
    monkeypatch.setattr("app.crud.semantic_search.search_note_ids", lambda query, limit: [])


def test_create_note() -> None:
    response = client.post("/notes", json={"title": "First note", "content": "Hello"})

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["title"] == "First note"
    assert body["content"] == "Hello"
    assert body["category"] == "General"
    assert body["tags"] == ["test", "note"]
    assert body["summary"] == "Summary for First note"
    assert "created_at" in body
    assert "updated_at" in body


def test_list_notes() -> None:
    client.post("/notes", json={"title": "One", "content": "First"})
    client.post("/notes", json={"title": "Two", "content": "Second"})

    response = client.get("/notes")

    assert response.status_code == 200
    assert [note["title"] for note in response.json()] == ["One", "Two"]


def test_get_note() -> None:
    created = client.post("/notes", json={"title": "Lookup", "content": "Find me"}).json()

    response = client.get(f"/notes/{created['id']}")

    assert response.status_code == 200
    assert response.json()["title"] == "Lookup"


def test_get_missing_note_returns_404() -> None:
    response = client.get("/notes/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"


def test_update_note() -> None:
    created = client.post("/notes", json={"title": "Draft", "content": "Old"}).json()

    response = client.patch(f"/notes/{created['id']}", json={"content": "Updated"})

    assert response.status_code == 200
    assert response.json()["title"] == "Draft"
    assert response.json()["content"] == "Updated"


def test_update_note_reindexes_embedding(monkeypatch: pytest.MonkeyPatch) -> None:
    indexed_note_ids: list[int] = []

    def fake_index_note(note: SimpleNamespace) -> None:
        indexed_note_ids.append(note.id)

    monkeypatch.setattr("app.crud.semantic_search.index_note", fake_index_note)
    created = client.post("/notes", json={"title": "Draft", "content": "Old"}).json()

    response = client.patch(f"/notes/{created['id']}", json={"content": "Updated"})

    assert response.status_code == 200
    assert indexed_note_ids == [created["id"], created["id"]]


def test_search_notes_returns_semantically_similar_notes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    first = client.post("/notes", json={"title": "Python", "content": "FastAPI notes"}).json()
    second = client.post("/notes", json={"title": "Garden", "content": "Tomato notes"}).json()

    monkeypatch.setattr(
        "app.crud.semantic_search.search_note_ids",
        lambda query, limit: [second["id"], first["id"]],
    )

    response = client.post("/search", json={"query": "plants", "limit": 5})

    assert response.status_code == 200
    assert [note["id"] for note in response.json()] == [second["id"], first["id"]]


def test_search_requires_query() -> None:
    response = client.post("/search", json={"query": ""})

    assert response.status_code == 422


def test_delete_note() -> None:
    created = client.post("/notes", json={"title": "Remove", "content": "Delete me"}).json()

    delete_response = client.delete(f"/notes/{created['id']}")
    get_response = client.get(f"/notes/{created['id']}")

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


def test_note_validation() -> None:
    response = client.post("/notes", json={"title": "", "content": ""})

    assert response.status_code == 422
