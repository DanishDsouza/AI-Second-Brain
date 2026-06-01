import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import ai_service, models, schemas, semantic_search
from app.exceptions import NoteAnalysisError, NoteIndexError


def create_note(db: Session, note: schemas.NoteCreate) -> models.Note:
    db_note = models.Note(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)

    # Persist full content first; analyze_note truncates internally for Ollama only.
    try:
        analysis = ai_service.analyze_note(title=db_note.title, content=db_note.content)
    except (httpx.HTTPError, ValueError) as error:
        raise NoteAnalysisError("AI analysis unavailable") from error

    db_note.category = analysis.category
    db_note.tags = analysis.tags
    db_note.summary = analysis.summary
    db.add(db_note)
    db.commit()
    db.refresh(db_note)

    try:
        semantic_search.index_note(db_note)
    except Exception as error:
        raise NoteIndexError("Failed to index note for search") from error

    return db_note


def list_notes(db: Session, skip: int = 0, limit: int = 100) -> list[models.Note]:
    statement = select(models.Note).order_by(models.Note.id).offset(skip).limit(limit)
    return list(db.scalars(statement).all())


def get_note(db: Session, note_id: int) -> models.Note | None:
    return db.get(models.Note, note_id)


def search_notes(db: Session, query: str, limit: int = 5) -> list[models.Note]:
    note_ids = semantic_search.search_note_ids(query=query, limit=limit)
    notes_by_id = {
        note.id: note
        for note in db.scalars(select(models.Note).where(models.Note.id.in_(note_ids))).all()
    }
    return [notes_by_id[note_id] for note_id in note_ids if note_id in notes_by_id]


def update_note(
    db: Session,
    db_note: models.Note,
    note_update: schemas.NoteUpdate,
) -> models.Note:
    update_data = note_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_note, field, value)

    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    semantic_search.index_note(db_note)
    return db_note


def delete_note(db: Session, db_note: models.Note) -> None:
    semantic_search.delete_note(db_note.id)
    db.delete(db_note)
    db.commit()
