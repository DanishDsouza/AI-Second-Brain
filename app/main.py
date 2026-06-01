from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Response, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import Base, engine, ensure_sqlite_note_analysis_columns, get_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_note_analysis_columns()
    yield


app = FastAPI(title="AI Second Brain API", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/notes", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)) -> models.Note:
    return crud.create_note(db, note)


@app.get("/notes", response_model=list[schemas.NoteRead])
def list_notes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[models.Note]:
    return crud.list_notes(db, skip=skip, limit=limit)


@app.get("/notes/{note_id}", response_model=schemas.NoteRead)
def get_note(note_id: int, db: Session = Depends(get_db)) -> models.Note:
    db_note = crud.get_note(db, note_id)
    if db_note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return db_note


@app.patch("/notes/{note_id}", response_model=schemas.NoteRead)
def update_note(
    note_id: int,
    note_update: schemas.NoteUpdate,
    db: Session = Depends(get_db),
) -> models.Note:
    db_note = crud.get_note(db, note_id)
    if db_note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return crud.update_note(db, db_note, note_update)


@app.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(get_db)) -> Response:
    db_note = crud.get_note(db, note_id)
    if db_note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    crud.delete_note(db, db_note)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
