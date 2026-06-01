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
- Image upload ingestion (PaddleOCR text extraction)
- React web frontend
- Tests

Future phases from PROJECT_PLAN.md are not implemented yet: RAG chatbot and
mobile app work.

## Web frontend

Minimal React UI in `frontend/` (view notes, create notes, semantic search, PDF
and image upload).

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
  pdf_service.py
  ocr_service.py
frontend/
  src/
tests/
  test_ai_service.py
  test_notes.py
  test_semantic_search.py
  test_pdf_upload.py
  test_image_upload.py
  test_ocr_service.py
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

`pip install` downloads large packages (sentence-transformers, PaddlePaddle,
PaddleOCR, PyMuPDF). Allow several minutes and roughly 1–2 GB of free disk space
for the virtual environment.

`numpy` is pinned to **1.26.4** because `paddleocr` requires `numpy<2.0` while
`chromadb` requires `numpy>=1.22.5`.

## Ollama (required for note creation)

**Ollama must be running** for every path that creates or ingests a note:
manual notes, PDF upload, and image upload. Without Ollama, ingestion returns
`503 AI analysis unavailable`.

The API uses the local Ollama HTTP API at http://127.0.0.1:11434 and defaults to
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
set EMBED_MAX_CHARS=8000
```

Embeddings use `title + category + tags + summary + content[:EMBED_MAX_CHARS]`.
Full note text remains in SQLite for display; only a leading excerpt is vectorized
for long PDFs and OCR notes.

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

## Image upload (OCR)

Upload a screenshot, photo, or scan to extract text in memory with **PaddleOCR**,
create a note, run **Ollama** analysis, and index embeddings in ChromaDB. Image
files are **not stored on disk**.

### Supported image types

- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- WEBP (`.webp`)

### OCR dependencies

Included in `requirements.txt` (no separate OCR install group):

- `paddlepaddle` (CPU)
- `paddleocr`
- `pillow` / `numpy` (decode and resize)

On first OCR use, PaddleOCR downloads detection/recognition models into your user
cache (typically **~20–50 MB** for the default English mobile models).

### Expected first-upload delay

| Step | Typical time (CPU laptop) |
|------|---------------------------|
| First OCR in a fresh API process | **~15–90 s** (model download + load) |
| Later images (warm server) | **~2–15 s** OCR + **Ollama** (up to 60 s) + embedding |

The React UI shows **“Processing image (OCR + AI)…”** while the request runs.

```bash
curl -X POST http://127.0.0.1:8000/upload/image -F "file=@screenshot.png"
```

Optional limits:

```bash
set MAX_IMAGE_BYTES=10485760
set OCR_TIMEOUT_SECONDS=120
set OCR_LANG=en
set MAX_IMAGE_DIMENSION=4096
```

`OCR_LANG` is passed to PaddleOCR (e.g. `en`; see PaddleOCR docs for other languages).

## Endpoints

- GET /health
- POST /notes
- POST /upload/pdf
- POST /upload/image
- GET /notes
- GET /notes/{note_id}
- PATCH /notes/{note_id}
- DELETE /notes/{note_id}
- POST /search

## Tests

```bash
pytest
```
