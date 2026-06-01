import json

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_SECONDS


class NoteAnalysis(BaseModel):
    category: str = Field(..., min_length=1)
    tags: list[str] = Field(default_factory=list)
    summary: str = Field(..., min_length=1)


def analyze_note(title: str, content: str, model_name: str = OLLAMA_MODEL) -> NoteAnalysis:
    prompt = _build_prompt(title, content)
    response = httpx.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        },
        timeout=OLLAMA_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    payload = response.json()
    raw_analysis = payload.get("response", "")
    return _parse_analysis(raw_analysis)


def _build_prompt(title: str, content: str) -> str:
    return (
        "Analyze this note and return only valid JSON with these fields: "
        "category as a short string, tags as an array of short strings, "
        "and summary as a concise string.\n\n"
        f"Title: {title}\n\n"
        f"Content:\n{content}"
    )


def _parse_analysis(raw_analysis: str) -> NoteAnalysis:
    try:
        parsed = json.loads(raw_analysis)
    except json.JSONDecodeError as error:
        raise ValueError("Ollama returned invalid JSON for note analysis") from error

    try:
        return NoteAnalysis.model_validate(parsed)
    except ValidationError as error:
        raise ValueError("Ollama returned incomplete note analysis") from error
