import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import ai_service, models, schemas, semantic_search
from app.config import RAG_EXCERPT_CHARS, RAG_MAX_CONTEXT_CHARS, RAG_TOP_K
from app.exceptions import RagGenerationError


def answer_question(db: Session, question: str) -> schemas.ChatResponse:
    note_ids = semantic_search.search_note_ids(query=question, limit=RAG_TOP_K)
    notes = _get_notes_by_ids_ordered(db, note_ids)

    if not notes:
        return schemas.ChatResponse(
            answer="I could not find any relevant notes in your knowledge base for that question.",
            sources=[],
        )

    context = _build_context(notes)
    try:
        answer = ai_service.generate_chat_answer(question=question, context=context)
    except (httpx.HTTPError, ValueError) as error:
        raise RagGenerationError("AI chat unavailable") from error

    sources = [schemas.ChatSource(id=note.id, title=note.title) for note in notes]
    return schemas.ChatResponse(answer=answer, sources=sources)


def _get_notes_by_ids_ordered(db: Session, note_ids: list[int]) -> list[models.Note]:
    if not note_ids:
        return []

    notes_by_id = {
        note.id: note
        for note in db.scalars(select(models.Note).where(models.Note.id.in_(note_ids))).all()
    }
    return [notes_by_id[note_id] for note_id in note_ids if note_id in notes_by_id]


def _build_context(notes: list[models.Note]) -> str:
    blocks: list[str] = []
    remaining_chars = RAG_MAX_CONTEXT_CHARS

    for note in notes:
        if remaining_chars <= 0:
            break

        block = _format_note_block(note, max_content_chars=min(RAG_EXCERPT_CHARS, remaining_chars))
        if len(block) > remaining_chars:
            block = block[:remaining_chars]
        blocks.append(block)
        remaining_chars -= len(block) + 2

    return "\n\n".join(blocks)


def _format_note_block(note: models.Note, max_content_chars: int) -> str:
    tags = ", ".join(note.tags) if note.tags else "(none)"
    content = note.content
    if len(content) > max_content_chars:
        content = content[:max_content_chars] + "\n[Content truncated for context window.]"

    return (
        f"--- Note id={note.id} title=\"{note.title}\" ---\n"
        f"Category: {note.category or '(none)'}\n"
        f"Tags: {tags}\n"
        f"Summary: {note.summary or '(none)'}\n"
        f"Content:\n{content}"
    )
