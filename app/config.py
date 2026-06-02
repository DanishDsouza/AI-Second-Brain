import os


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "60"))

CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
CHROMA_COLLECTION_NAME = os.getenv("CHROMA_COLLECTION_NAME", "notes")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
HUGGINGFACE_CACHE_PATH = os.getenv("HF_HOME", "./.hf_cache")

MAX_PDF_BYTES = int(os.getenv("MAX_PDF_BYTES", str(20 * 1024 * 1024)))
MAX_NOTE_CONTENT_CHARS = int(os.getenv("MAX_NOTE_CONTENT_CHARS", "500000"))
MAX_ANALYSIS_CONTENT_CHARS = int(os.getenv("MAX_ANALYSIS_CONTENT_CHARS", "12000"))

MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "4096"))
OCR_LANG = os.getenv("OCR_LANG", "en")
OCR_TIMEOUT_SECONDS = float(os.getenv("OCR_TIMEOUT_SECONDS", "120"))
EMBED_MAX_CHARS = int(os.getenv("EMBED_MAX_CHARS", "8000"))

RAG_TOP_K = int(os.getenv("RAG_TOP_K", "8"))
RAG_EXCERPT_CHARS = int(os.getenv("RAG_EXCERPT_CHARS", "3000"))
RAG_MAX_CONTEXT_CHARS = int(os.getenv("RAG_MAX_CONTEXT_CHARS", "24000"))
