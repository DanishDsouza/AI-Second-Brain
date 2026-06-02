"""Reproduce the image upload error with full traceback."""
import io
import os
import sys
import traceback

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Create a small valid PNG in memory
from PIL import Image, ImageDraw
img = Image.new("RGB", (100, 50), color="white")
draw = ImageDraw.Draw(img)
draw.text((5, 15), "Hello world OCR", fill="black")
buf = io.BytesIO()
img.save(buf, format="PNG")
png_bytes = buf.getvalue()

# Mock only the AI analysis step to avoid depending on Ollama
import app.semantic_search
original_index = app.semantic_search.index_note
def debug_index(note):
    print(f"[DEBUG] index_note called for note.id={note.id}")
    print(f"[DEBUG] note.title={note.title!r}")
    print(f"[DEBUG] note.content length={len(note.content)}")
    print(f"[DEBUG] note.category={note.category!r}")
    print(f"[DEBUG] note.tags={note.tags}")
    print(f"[DEBUG] note.summary={note.summary!r}")
    try:
        result = original_index(note)
        print(f"[DEBUG] index_note SUCCESS")
        return result
    except Exception as e:
        print(f"[DEBUG] index_note FAILED: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise

app.semantic_search.index_note = debug_index

import app.crud
original_create = app.crud.create_note
def patched_create_note(db, note):
    from app import models
    db_note = models.Note(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    db_note.category = "Test"
    db_note.tags = ["test"]
    db_note.summary = "OCR test summary"
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    try:
        from app import semantic_search
        semantic_search.index_note(db_note)
    except Exception:
        raise
    return db_note
app.crud.create_note = patched_create_note

print(f"Sending {len(png_bytes)} bytes PNG")
response = client.post(
    "/upload/image",
    files={"file": ("test.png", png_bytes, "image/png")},
)
print(f"\nStatus: {response.status_code}")
print(f"Response body: {response.json()}")
