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
- Tests

Future phases from PROJECT_PLAN.md are not implemented yet: PDF uploads, OCR,
RAG, and mobile app work.

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

## Endpoints

- GET /health
- POST /notes
- GET /notes
- GET /notes/{note_id}
- PATCH /notes/{note_id}
- DELETE /notes/{note_id}
- POST /search

## Tests

```bash
pytest
```
