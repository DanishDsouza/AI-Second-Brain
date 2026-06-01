import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Library, Upload } from "lucide-react";

import * as api from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteCard } from "@/features/notes/NoteCard";
import type { Note } from "@/types";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotes(await api.listNotes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild>
          <Link to="/upload?tab=text">
            <Upload className="h-4 w-4" />
            Add note
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      ) : null}

      {!loading && notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <Library className="mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No notes yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Create a text note or upload a PDF or image to start building your knowledge base.
          </p>
          <Button asChild className="mt-6">
            <Link to="/upload">Go to Upload Center</Link>
          </Button>
        </div>
      ) : null}

      {!loading && notes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
