# Running Locally on Windows

Use PowerShell from the project root.

```powershell
cd C:\Users\danly\OneDrive\Documents\AI-Second-Brain
```

## Create the virtual environment

This is the Python executable used to verify the project in Codex on this Windows machine:

```powershell
C:\Users\danly\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m venv .venv
```

If Python is installed on your PATH, this also works:

```powershell
python -m venv .venv
```

## Install dependencies

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Run tests

```powershell
.\.venv\Scripts\python.exe -m pytest
```

## Prepare Ollama

Phase 2 analyzes new notes with the local Ollama API and defaults to
`gemma3:4b`.

```powershell
ollama pull gemma3:4b
ollama serve
```

Optional model configuration:

```powershell
$env:OLLAMA_MODEL = "gemma3:4b"
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
```

## Configure semantic search

Phase 3 stores embeddings in ChromaDB and defaults to
`sentence-transformers/all-MiniLM-L6-v2`.

Optional configuration:

```powershell
$env:EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
$env:CHROMA_PATH = "./chroma_db"
$env:CHROMA_COLLECTION_NAME = "notes"
```

## Start the FastAPI server

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open the API docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

Semantic search:

```powershell
$body = @{ query = "notes about API development"; limit = 5 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/search" -Method Post -ContentType "application/json" -Body $body
```
