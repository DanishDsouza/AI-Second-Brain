import { useCallback, useEffect, useState } from "react";

import * as api from "./api";
import { NoteForm } from "./components/NoteForm";
import { NoteList } from "./components/NoteList";
import { ImageUploadForm } from "./components/ImageUploadForm";
import { PdfUploadForm } from "./components/PdfUploadForm";
import { SearchPanel } from "./components/SearchPanel";
import type { Note } from "./types";

type ViewMode = "all" | "search";

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listNotes();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  async function handleCreate(title: string, content: string) {
    setBusy(true);
    setError(null);
    try {
      const created = await api.createNote({ title, content });
      setNotes((current) => [...current, created]);
      if (viewMode === "search") {
        setSearchResults(null);
        setViewMode("all");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setBusy(false);
    }
  }

  async function handlePdfUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      await api.uploadPdf(file);
      setSearchResults(null);
      setViewMode("all");
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleImageUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      await api.uploadImage(file);
      setSearchResults(null);
      setViewMode("all");
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch(query: string) {
    setBusy(true);
    setError(null);
    try {
      const results = await api.searchNotes({ query, limit: 5 });
      setSearchResults(results);
      setViewMode("search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  function handleClearSearch() {
    setSearchResults(null);
    setViewMode("all");
  }

  const displayedNotes = viewMode === "search" && searchResults !== null ? searchResults : notes;
  const listHeading =
    viewMode === "search" ? `Search results (${displayedNotes.length})` : `All notes (${displayedNotes.length})`;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", margin: "1rem 2rem", maxWidth: "48rem" }}>
      <h1>AI Second Brain</h1>

      {error ? (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      ) : null}

      <NoteForm onSubmit={handleCreate} disabled={busy} />
      <PdfUploadForm onUpload={handlePdfUpload} disabled={busy} />
      <ImageUploadForm onUpload={handleImageUpload} disabled={busy} />
      <SearchPanel
        onSearch={handleSearch}
        onClear={handleClearSearch}
        disabled={busy}
        isSearchActive={viewMode === "search"}
      />

      {loading ? <p>Loading notes…</p> : <NoteList notes={displayedNotes} heading={listHeading} />}
    </main>
  );
}
