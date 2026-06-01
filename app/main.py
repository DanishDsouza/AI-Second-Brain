from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.config import MAX_NOTE_CONTENT_CHARS, MAX_PDF_BYTES
from app.database import Base, engine, ensure_sqlite_note_analysis_columns, get_db
from app.exceptions import NoteAnalysisError, NoteIndexError
from app.pdf_service import EmptyPdfError, PdfExtractionError, extract_text_from_pdf


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_note_analysis_columns()
    yield


app = FastAPI(title="AI Second Brain API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/notes", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)) -> models.Note:
    try:
        return crud.create_note(db, note)
    except NoteAnalysisError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis unavailable",
        ) from error
    except NoteIndexError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to index note for search",
        ) from error


@app.post("/upload/pdf", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED)
def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> models.Note:
    contents = file.file.read()
    if not contents or not _is_pdf_upload(file, contents):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type; PDF required",
        )

    if len(contents) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="PDF exceeds maximum size",
        )

    try:
        extracted_text = extract_text_from_pdf(contents)
    except EmptyPdfError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except PdfExtractionError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF extraction failed",
        ) from error

    if len(extracted_text) > MAX_NOTE_CONTENT_CHARS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Extracted text exceeds maximum length",
        )

    title = _title_from_upload_filename(file.filename)
    # Full extracted text is stored; create_note truncates only for Ollama analysis.
    note = schemas.NoteCreate(title=title, content=extracted_text)

    try:
        return crud.create_note(db, note)
    except NoteAnalysisError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis unavailable",
        ) from error
    except NoteIndexError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to index note for search",
        ) from error


def _is_pdf_upload(file: UploadFile, contents: bytes) -> bool:
    if contents.startswith(b"%PDF"):
        return True

    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    return filename.endswith(".pdf") or content_type == "application/pdf"


def _title_from_upload_filename(filename: str | None) -> str:
    stem = Path(filename or "upload.pdf").stem.strip()
    if not stem:
        return "PDF upload"
    return stem[:200]


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


@app.post("/search", response_model=list[schemas.NoteRead])
def search_notes(
    search_query: schemas.SearchQuery,
    db: Session = Depends(get_db),
) -> list[models.Note]:
    return crud.search_notes(db, query=search_query.query, limit=search_query.limit)


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
