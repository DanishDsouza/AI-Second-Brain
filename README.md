# AI Second Brain

Backend for an AI-powered personal knowledge management system.

Implemented phases:

- FastAPI
- SQLite
- SQLAlchemy
- Notes CRUD
- Pydantic schemas
- Ollama-powered note analysis
- Categories, tags, and summaries
- ChromaDB semantic search
- sentence-transformers embeddings
- PDF upload ingestion (PyMuPDF text extraction)
- React web frontend
- Tests

Future phases from PROJECT_PLAN.md are not implemented yet: OCR, RAG, and
mobile app work.

## Web frontend

Minimal React UI in `frontend/` (view notes, create notes, semantic search).

```bash
cd frontend
npm install
npm run dev
```

With the API running at http://127.0.0.1:8000, open http://127.0.0.1:5173. Vite proxies `/api` to the backend.

Optional: set `VITE_API_BASE_URL=http://127.0.0.1:8000` in `frontend/.env` to call the API directly (requires CORS; enabled for port 5173).

## Project Structure

```text
app/
  __init__.py
  ai_service.py
  config.py
  crud.py
  database.py
  main.py
  models.py
  schemas.py
  semantic_search.py
frontend/
  src/
tests/
  test_ai_service.py
  test_notes.py
  test_semantic_search.py
PROJECT_PLAN.md
README.md
requirements.txt
```

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Ollama

Phase 2 uses the local Ollama API at http://127.0.0.1:11434 and defaults to
the gemma3:4b model.

```bash
ollama pull gemma3:4b
ollama serve
```

Optional configuration:

```bash
set OLLAMA_MODEL=gemma3:4b
set OLLAMA_BASE_URL=http://127.0.0.1:11434
```

## Semantic Search

Phase 3 stores note embeddings in ChromaDB when notes are created or updated.
The default embedding model is `sentence-transformers/all-MiniLM-L6-v2`.

Optional configuration:

```bash
set EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
set CHROMA_PATH=./chroma_db
set CHROMA_COLLECTION_NAME=notes
```

## Run the API

```bash
uvicorn app.main:app --reload
```

The API will be available at http://127.0.0.1:8000.

Interactive docs are available at http://127.0.0.1:8000/docs.

## PDF upload

Upload a PDF to extract text in memory, create a note, run Ollama analysis, and
index embeddings in ChromaDB. PDF files are not stored on disk.

```bash
curl -X POST http://127.0.0.1:8000/upload/pdf -F "file=@document.pdf"
```

Optional limits:

```bash
set MAX_PDF_BYTES=20971520
set MAX_NOTE_CONTENT_CHARS=500000
set MAX_ANALYSIS_CONTENT_CHARS=12000
```

## Endpoints

- GET /health
- POST /notes
- POST /upload/pdf
- GET /notes
- GET /notes/{note_id}
- PATCH /notes/{note_id}
- DELETE /notes/{note_id}
- POST /search

## Tests

```bash
pytest
```
