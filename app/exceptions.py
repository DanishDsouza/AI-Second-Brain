class NoteAnalysisError(Exception):
    """Raised when Ollama note analysis fails."""


class NoteIndexError(Exception):
    """Raised when ChromaDB indexing fails."""


class RagGenerationError(Exception):
    """Raised when Ollama RAG chat generation fails."""
