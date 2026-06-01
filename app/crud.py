from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas


def create_note(db: Session, note: schemas.NoteCreate) -> models.Note:
    db_note = models.Note(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def list_notes(db: Session, skip: int = 0, limit: int = 100) -> list[models.Note]:
    statement = select(models.Note).order_by(models.Note.id).offset(skip).limit(limit)
    return list(db.scalars(statement).all())


def get_note(db: Session, note_id: int) -> models.Note | None:
    return db.get(models.Note, note_id)


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
    return db_note


def delete_note(db: Session, db_note: models.Note) -> None:
    db.delete(db_note)
    db.commit()
