import json

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.config import (
    MAX_ANALYSIS_CONTENT_CHARS,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    OLLAMA_TIMEOUT_SECONDS,
)


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
    # Ollama receives a possibly shortened excerpt only; callers pass the full note
    # content so SQLite and embeddings keep the complete document (see crud.create_note).
    analysis_content = _content_for_analysis(content)
    return (
        "Analyze this note and return only valid JSON with these fields: "
        "category as a short string, tags as an array of short strings, "
        "and summary as a concise string. "
        "The content below is the primary source of truth for determining category and tags; "
        "use the title only as supporting context.\n\n"
        f"Title: {title}\n\n"
        f"Content:\n{analysis_content}"
    )


def _content_for_analysis(content: str) -> str:
    """Return the text sent to Ollama for category/tags/summary.

    Full note content stays in the database and in Chroma embedding payloads;
    only this excerpt is used for LLM analysis because context windows and latency
    do not scale to entire PDFs or very long notes.
    """
    if len(content) <= MAX_ANALYSIS_CONTENT_CHARS:
        return content

    truncated = content[:MAX_ANALYSIS_CONTENT_CHARS]
    return (
        f"{truncated}\n\n"
        "[Note: content was truncated for analysis because the source text is very long.]"
    )


_CHAT_SYSTEM_PROMPT = (
    "You are a personal knowledge assistant. Answer the question using ONLY the "
    "provided source notes. When you use information from a note, cite it inline "
    "as [note:ID] where ID is the note id from the source block. If the sources "
    "do not contain enough information to answer, say so clearly. Do not invent "
    "facts or note ids."
)


def generate_chat_answer(
    question: str,
    context: str,
    model_name: str = OLLAMA_MODEL,
) -> str:
    response = httpx.post(
        f"{OLLAMA_BASE_URL}/api/chat",
        json={
            "model": model_name,
            "messages": [
                {"role": "system", "content": _CHAT_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Question:\n{question}\n\nSources:\n{context}",
                },
            ],
            "stream": False,
        },
        timeout=OLLAMA_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    message = response.json().get("message", {})
    content = message.get("content", "")
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Ollama returned an empty chat response")
    return content.strip()


def _parse_analysis(raw_analysis: str) -> NoteAnalysis:
    try:
        parsed = json.loads(raw_analysis)
    except json.JSONDecodeError as error:
        raise ValueError("Ollama returned invalid JSON for note analysis") from error

    try:
        return NoteAnalysis.model_validate(parsed)
    except ValidationError as error:
        raise ValueError("Ollama returned incomplete note analysis") from error
