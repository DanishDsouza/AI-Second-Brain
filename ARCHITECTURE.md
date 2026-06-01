# AI Second Brain — Architecture

This document describes how the backend is structured and how data flows through FastAPI, SQLite, Ollama, embeddings, ChromaDB, and semantic search. It reflects the implemented Phases 1–3; future work (PDF, OCR, RAG, mobile) is outlined in `PROJECT_PLAN.md` but not built yet.

## System overview

The application is a single-process FastAPI service that:

1. Stores notes in **SQLite** via SQLAlchemy (source of truth).
2. Enriches new notes with **Ollama** (category, tags, summary).
3. Indexes notes in **ChromaDB** using **sentence-transformers** embeddings.
4. Answers semantic queries by ranking in ChromaDB and hydrating full records from SQLite.

```text
                    ┌─────────────────┐
                    │   HTTP Client   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  FastAPI (main) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     crud.py     │
                    └───┬─────┬───┬───┘
                        │     │   │
           ┌────────────┘     │   └────────────┐
           ▼                  ▼                ▼
    ┌──────────────┐   ┌─────────────┐  ┌──────────────────┐
    │   SQLite     │   │ ai_service  │  │ semantic_search  │
    │  (notes)     │   │  (Ollama)   │  │ (ST + ChromaDB)  │
    └──────────────┘   └─────────────┘  └──────────────────┘
```

| Component | Module(s) | Persistence |
|-----------|-----------|-------------|
| API layer | `app/main.py`, `app/schemas.py` | — |
| Business logic | `app/crud.py` | Orchestrates DB + AI + vectors |
| Relational DB | `app/database.py`, `app/models.py` | `notes.db` (default) |
| LLM analysis | `app/ai_service.py`, `app/config.py` | Ollama HTTP API |
| Vector search | `app/semantic_search.py`, `app/config.py` | `./chroma_db` (default) |

---

## FastAPI architecture

### Application entry

- **App factory**: `FastAPI(title="AI Second Brain API", version="0.1.0", lifespan=lifespan)` in `app/main.py`.
- **Lifespan**: On startup, creates SQLAlchemy tables (`Base.metadata.create_all`) and runs `ensure_sqlite_note_analysis_columns()` for legacy SQLite databases missing Phase 2 columns.

### Layering

| Layer | Responsibility |
|-------|----------------|
| **Routes** (`main.py`) | HTTP mapping, status codes, `HTTPException` for 404 |
| **Schemas** (`schemas.py`) | Pydantic validation for request/response bodies |
| **CRUD** (`crud.py`) | Create/read/update/delete orchestration, search assembly |
| **Models** (`models.py`) | SQLAlchemy ORM `Note` entity |
| **Services** | `ai_service.py` (Ollama), `semantic_search.py` (embeddings + Chroma) |

Routes stay thin: they resolve a DB session, call `crud`, and return ORM objects serialized through `response_model` schemas.

### Dependency injection

- `get_db()` in `app/database.py` yields a SQLAlchemy `Session` per request and closes it in a `finally` block.
- Injected via `Depends(get_db)` on all note and search endpoints.

### Endpoints

| Method | Path | Handler | Response |
|--------|------|---------|----------|
| GET | `/health` | Liveness | `{ "status": "ok" }` |
| POST | `/notes` | `crud.create_note` | `NoteRead` (201) |
| GET | `/notes` | `crud.list_notes` | `list[NoteRead]` |
| GET | `/notes/{note_id}` | `crud.get_note` | `NoteRead` or 404 |
| PATCH | `/notes/{note_id}` | `crud.update_note` | `NoteRead` or 404 |
| DELETE | `/notes/{note_id}` | `crud.delete_note` | 204 or 404 |
| POST | `/search` | `crud.search_notes` | `list[NoteRead]` |

### Request/response models

- **Create**: `NoteCreate` — `title` (1–200 chars), `content` (min length 1).
- **Update**: `NoteUpdate` — optional `title`, `content` (partial update via `exclude_unset`).
- **Read**: `NoteRead` — base fields plus `id`, `category`, `tags`, `summary`, `created_at`, `updated_at`.
- **Search**: `SearchQuery` — `query` (required), `limit` (default 5, min 1, **max 5**).

### Execution model

All route handlers are **synchronous** (`def`, not `async def`). Ollama HTTP calls, embedding encoding, and Chroma I/O run on the worker thread for the duration of the request. There is no background task queue.

### Configuration

Environment variables are read in `app/config.py` (defaults shown):

| Variable | Default | Used by |
|----------|---------|---------|
| `DATABASE_URL` | `sqlite:///./notes.db` | `database.py` |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | `ai_service.py` |
| `OLLAMA_MODEL` | `gemma3:4b` | `ai_service.py` |
| `OLLAMA_TIMEOUT_SECONDS` | `60` | `ai_service.py` |
| `CHROMA_PATH` | `./chroma_db` | `semantic_search.py` |
| `CHROMA_COLLECTION_NAME` | `notes` | `semantic_search.py` |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | `semantic_search.py` |
| `HF_HOME` | `./.hf_cache` | `semantic_search.py` (model cache) |

---

## SQLite schema

### Engine and sessions

- SQLAlchemy 2.0 with `create_engine(DATABASE_URL)`.
- SQLite uses `connect_args={"check_same_thread": False}` when the URL starts with `sqlite`.
- `SessionLocal` sessionmaker: `autocommit=False`, `autoflush=False`.

### Table: `notes`

Defined by the `Note` model in `app/models.py`.

| Column | SQLAlchemy type | Constraints / defaults |
|--------|-----------------|-------------------------|
| `id` | `Integer` | Primary key, indexed |
| `title` | `String(200)` | Required, indexed |
| `content` | `Text` | Required |
| `category` | `String(100)` | `NOT NULL`, default `''` |
| `tags` | `JSON` | List of strings, `NOT NULL`, default `[]` |
| `summary` | `Text` | `NOT NULL`, default `''` |
| `created_at` | `DateTime(timezone=True)` | `server_default=now()` |
| `updated_at` | `DateTime(timezone=True)` | `server_default=now()`, `onupdate=now()` |

Phase 2 fields (`category`, `tags`, `summary`) are populated by Ollama on **create**; they are not re-computed on **update** unless changed manually via a future feature.

### Schema lifecycle

1. **New deployments**: `create_all` in app lifespan creates the full table.
2. **Upgrades from Phase 1**: `ensure_sqlite_note_analysis_columns()` inspects `PRAGMA table_info(notes)` and runs `ALTER TABLE ... ADD COLUMN` for any missing analysis columns.

There is no Alembic migration history; schema changes are implicit at startup.

### Role in the system

SQLite is the **authoritative store** for note content and metadata. ChromaDB holds derived vectors for retrieval; search results are always reconciled against SQLite by note ID.

---

## Ollama integration

### Purpose

On note **creation**, the service calls a local Ollama instance to produce:

- `category` — short label string
- `tags` — array of short strings
- `summary` — concise text

### Client (`app/ai_service.py`)

1. Build a natural-language prompt (`_build_prompt`) including title and content, instructing JSON-only output with the three fields.
2. `POST {OLLAMA_BASE_URL}/api/generate` with body:
   - `model`: from `OLLAMA_MODEL`
   - `prompt`: built prompt
   - `stream`: `false`
   - `format`: `"json"` (Ollama JSON mode)
3. Read `response` from the JSON body (string containing JSON).
4. Parse with `json.loads`, validate into `NoteAnalysis` (Pydantic).

### Error handling

- Invalid JSON → `ValueError` ("Ollama returned invalid JSON for note analysis").
- Schema validation failure → `ValueError` ("Ollama returned incomplete note analysis").
- HTTP errors → `httpx` `raise_for_status()` (propagates as unhandled exception unless caught upstream).

### When Ollama runs

| Operation | Ollama called? |
|-----------|----------------|
| `POST /notes` | Yes — after first DB commit, before second commit and indexing |
| `PATCH /notes/{id}` | No |
| `POST /search` | No |
| `DELETE /notes/{id}` | No |

### Create-note sequence (with Ollama)

```text
POST /notes
    │
    ▼
Insert Note(title, content) ──► commit #1
    │
    ▼
analyze_note(title, content) ──► Ollama /api/generate
    │
    ▼
Update category, tags, summary ──► commit #2
    │
    ▼
semantic_search.index_note(note)
    │
    ▼
Return NoteRead
```

If Ollama fails after commit #1, the note exists with empty analysis fields and is not indexed in ChromaDB (index runs only after commit #2).

---

## Embedding flow

Embeddings are produced in `app/semantic_search.py` using **sentence-transformers**, not Chroma’s built-in embedding functions.

### Model loading

- `get_embedding_model()` is cached with `@lru_cache(maxsize=1)`.
- Sets `HF_HOME` and `SENTENCE_TRANSFORMERS_HOME` from config.
- If a local Hugging Face cache snapshot exists, sets `HF_HUB_OFFLINE=1` to avoid network access.
- Loads `SentenceTransformer(EMBEDDING_MODEL)` (default: `all-MiniLM-L6-v2`, 384-dimensional vectors).

### Text used for embedding

For indexing, `_note_embedding_text(note)` concatenates:

```text
Title: {title}
Category: {category}
Tags: {tag1}, {tag2}, ...
Summary: {summary}
Content: {content}
```

For search, the **raw user query string** is embedded directly (not wrapped in the same template).

### Encoding

```text
generate_embedding(text)
    │
    ▼
get_embedding_model().encode(text)
    │
    ▼
list[float]  (explicit cast for Chroma)
```

### When embeddings are computed

| Event | Action |
|-------|--------|
| Note created (after Ollama + commit #2) | `index_note` → upsert with new embedding |
| Note updated | `index_note` → upsert (same Chroma id, new embedding) |
| Search query | Embed query once per request |
| Note deleted | Chroma `delete` only (no embedding) |

**Important**: On update, embeddings include `category`, `tags`, and `summary` from the database. Those fields are **not** refreshed by Ollama when only `title` or `content` changes, so the vector can mix new content with stale analysis metadata.

---

## ChromaDB flow

### Client and collection

- `chromadb.PersistentClient(path=CHROMA_PATH)` — on-disk storage under `./chroma_db` by default.
- `get_or_create_collection(name=CHROMA_COLLECTION_NAME)` — cached singleton per process.

### Indexing (`index_note`)

Each note maps to one Chroma record:

| Field | Value |
|-------|--------|
| `ids` | `[str(note.id)]` |
| `documents` | Full `_note_embedding_text(note)` string |
| `embeddings` | `[generate_embedding(text)]` — **supplied by app** |
| `metadatas` | `{ "note_id", "title", "category" }` |

`upsert` is used so create and update share the same ID semantics.

### Deletion (`delete_note`)

Before the SQL row is removed, `get_collection().delete(ids=[str(note_id)])` removes the vector.

### Query (`search_note_ids`)

```text
collection.query(
    query_embeddings=[generate_embedding(query)],
    n_results=limit,
)
```

Returns ordered note IDs from `results["ids"][0]` (strings converted to `int`).

Chroma performs nearest-neighbor search using the provided query embedding against stored embeddings. Similarity scores are not exposed to the API.

### Consistency model

SQLite commits and Chroma upserts/deletes are **not transactional**. Order of operations:

- **Create**: SQLite (×2) then Chroma upsert
- **Update**: SQLite commit then Chroma upsert
- **Delete**: Chroma delete then SQLite delete

A failure between steps can leave the two stores out of sync until repaired manually or by a future reconciliation job.

---

## Search flow

### API

`POST /search` accepts `SearchQuery` and returns `list[NoteRead]` — full note objects in similarity order, without scores or snippets.

### End-to-end pipeline

```text
Client POST /search { "query": "...", "limit": N }
    │
    ▼
main.search_notes ──► crud.search_notes(db, query, limit)
    │
    ├─► semantic_search.search_note_ids(query, limit)
    │       │
    │       ├─► generate_embedding(query)
    │       └─► Chroma collection.query → [id₁, id₂, ...]
    │
    └─► SELECT * FROM notes WHERE id IN (...)
            │
            ▼
        Reorder rows to match Chroma id order
        (skip ids missing in SQLite)
            │
            ▼
        Return list[Note]
```

### Ordering and filtering

1. Chroma defines **rank order** by vector distance.
2. SQLite hydrates rows by ID.
3. `crud.search_notes` builds a dict `id → Note` and outputs `[notes_by_id[id] for id in note_ids if id in notes_by_id]`.

Effects:

- Stale Chroma entries (note deleted in SQLite but not in Chroma) are **silently dropped**; the client may receive fewer than `limit` results.
- No cross-check that returned notes still match the query beyond vector similarity.

### Limits

- `SearchQuery.limit` is capped at **5** in Pydantic validation.
- List notes (`GET /notes`) allows `limit` up to 100 — search is intentionally narrower.

### What search does not do

- Keyword / full-text search on SQLite
- Metadata filters (category, tags, date range)
- RAG or LLM-generated answers (planned Phase 5)
- Returning similarity scores or highlighted spans

---

## Package layout (reference)

```text
app/
  main.py              # FastAPI app and routes
  schemas.py           # Pydantic models
  crud.py              # Orchestration
  models.py            # SQLAlchemy Note
  database.py          # Engine, session, migrations helper
  config.py            # Environment defaults
  ai_service.py        # Ollama client
  semantic_search.py   # Embeddings and ChromaDB
tests/                 # API and unit tests (mock external services)
```

---

## Operational notes

- **Run**: `uvicorn app.main:app --reload` (see `README.md`, `RUNNING.md`).
- **Prerequisites**: Ollama running for note creation; first embedding load may download the transformer model.
- **Artifacts on disk**: `notes.db`, `chroma_db/`, `.hf_cache/` (gitignored).
- **Health**: `/health` does not verify Ollama, Chroma, or model readiness.

For roadmap and unimplemented features, see `PROJECT_PLAN.md`.
