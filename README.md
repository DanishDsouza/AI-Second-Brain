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
- Tests

Future phases from PROJECT_PLAN.md are not implemented yet: ChromaDB,
embeddings, semantic search, PDF uploads, OCR, RAG, and mobile app work.

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
tests/
  test_notes.py
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

## Tests

```bash
pytest
```
