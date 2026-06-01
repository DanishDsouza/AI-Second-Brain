from functools import lru_cache
import os
from pathlib import Path
from typing import Any

from app import models
from app.config import (
    CHROMA_COLLECTION_NAME,
    CHROMA_PATH,
    EMBED_MAX_CHARS,
    EMBEDDING_MODEL,
    HUGGINGFACE_CACHE_PATH,
)


@lru_cache(maxsize=1)
def get_embedding_model() -> Any:
    os.environ.setdefault("HF_HOME", HUGGINGFACE_CACHE_PATH)
    os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", HUGGINGFACE_CACHE_PATH)
    if _model_cache_exists():
        os.environ.setdefault("HF_HUB_OFFLINE", "1")

    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(EMBEDDING_MODEL)


@lru_cache(maxsize=1)
def get_collection() -> Any:
    import chromadb

    client = chromadb.PersistentClient(path=CHROMA_PATH)
    return client.get_or_create_collection(name=CHROMA_COLLECTION_NAME)


def generate_embedding(text: str) -> list[float]:
    embedding = get_embedding_model().encode(text)
    return [float(value) for value in embedding]


def index_note(note: models.Note) -> None:
    text = _note_embedding_text(note)
    get_collection().upsert(
        ids=[str(note.id)],
        documents=[text],
        embeddings=[generate_embedding(text)],
        metadatas=[
            {
                "note_id": note.id,
                "title": note.title,
                "category": note.category,
            }
        ],
    )


def delete_note(note_id: int) -> None:
    get_collection().delete(ids=[str(note_id)])


def search_note_ids(query: str, limit: int = 5) -> list[int]:
    results = get_collection().query(
        query_embeddings=[generate_embedding(query)],
        n_results=limit,
    )
    ids = results.get("ids", [[]])
    return [int(note_id) for note_id in ids[0]]


def _note_embedding_text(note: models.Note) -> str:
    """Build the string encoded for ChromaDB.

    Full note content stays in SQLite; only a leading content excerpt is embedded
    so vectors stay predictable for long PDFs and OCR notes.
    """
    tags = ", ".join(note.tags)
    content = _content_for_embedding(note.content)
    return (
        f"Title: {note.title}\n"
        f"Category: {note.category}\n"
        f"Tags: {tags}\n"
        f"Summary: {note.summary}\n"
        f"Content: {content}"
    )


def _content_for_embedding(content: str) -> str:
    if len(content) <= EMBED_MAX_CHARS:
        return content
    return content[:EMBED_MAX_CHARS]


def _model_cache_exists() -> bool:
    cache_name = f"models--{EMBEDDING_MODEL.replace('/', '--')}"
    return (Path(HUGGINGFACE_CACHE_PATH) / cache_name / "snapshots").exists()
