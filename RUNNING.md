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
