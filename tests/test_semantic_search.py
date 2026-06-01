from types import SimpleNamespace

from app import semantic_search


class FakeCollection:
    def __init__(self) -> None:
        self.upserts: list[dict[str, object]] = []
        self.deleted_ids: list[str] = []

    def upsert(self, **kwargs: object) -> None:
        self.upserts.append(kwargs)

    def delete(self, ids: list[str]) -> None:
        self.deleted_ids.extend(ids)

    def query(self, **kwargs: object) -> dict[str, list[list[str]]]:
        return {"ids": [["2", "1"]]}


def test_index_note_stores_embedding(monkeypatch) -> None:
    collection = FakeCollection()
    note = SimpleNamespace(
        id=7,
        title="Search",
        content="Semantic note search",
        category="Engineering",
        tags=["search", "embeddings"],
        summary="Build semantic search.",
    )

    monkeypatch.setattr(semantic_search, "get_collection", lambda: collection)
    monkeypatch.setattr(semantic_search, "generate_embedding", lambda text: [0.1, 0.2])

    semantic_search.index_note(note)

    assert collection.upserts[0]["ids"] == ["7"]
    assert collection.upserts[0]["embeddings"] == [[0.1, 0.2]]
    assert collection.upserts[0]["metadatas"] == [
        {"note_id": 7, "title": "Search", "category": "Engineering"}
    ]


def test_search_note_ids_queries_top_five(monkeypatch) -> None:
    collection = FakeCollection()

    monkeypatch.setattr(semantic_search, "get_collection", lambda: collection)
    monkeypatch.setattr(semantic_search, "generate_embedding", lambda text: [0.3, 0.4])

    assert semantic_search.search_note_ids("semantic search", limit=5) == [2, 1]


def test_delete_note_removes_embedding(monkeypatch) -> None:
    collection = FakeCollection()

    monkeypatch.setattr(semantic_search, "get_collection", lambda: collection)

    semantic_search.delete_note(9)

    assert collection.deleted_ids == ["9"]
