import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import * as api from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextNoteTab() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      return;
    }

    setBusy(true);
    setError(null);
    setCreatedId(null);
    try {
      const note = await api.createNote({ title: trimmedTitle, content: trimmedContent });
      setCreatedId(note.id);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {createdId !== null ? (
        <Alert>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Note created successfully.</span>
            <Button asChild size="sm" variant="outline">
              <Link to={`/notes/${createdId}`}>View note</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title</Label>
          <Input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={busy}
            maxLength={200}
            placeholder="Meeting notes"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note-content">Content</Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={busy}
            placeholder="Write your note here…"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Creating (AI analysis may take a minute)…" : "Create note"}
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => navigate("/notes")}>
            View all notes
          </Button>
        </div>
      </form>
    </div>
  );
}
