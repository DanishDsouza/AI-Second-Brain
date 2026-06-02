import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, MessageSquare, Pencil, Trash2, X } from "lucide-react";

import * as api from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeDate } from "@/lib/formatDate";
import type { Note } from "@/types";

export default function NoteDetailPage() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const id = Number(noteId);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadNote = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError("Invalid note id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setNote(await api.getNote(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load note");
      setNote(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadNote();
  }, [loadNote]);

  function startEditing() {
    if (!note) return;
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
    setError(null);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
    setError(null);
  }

  async function handleSave() {
    if (!note || !editTitle.trim() || !editContent.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateNote(note.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setNote(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!note) return;
    if (!window.confirm(`Delete "${note.title}"? This action cannot be undone.`)) return;

    setDeleting(true);
    setError(null);
    try {
      await api.deleteNote(note.id);
      navigate("/notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if ((error && !note) || (!loading && !note)) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/notes">
            <ArrowLeft className="h-4 w-4" />
            Back to notes
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error ?? "Note not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isBusy = saving || deleting;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link to="/notes">
            <ArrowLeft className="h-4 w-4" />
            Back to notes
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="default" size="sm" disabled={isBusy || !editTitle.trim() || !editContent.trim()} onClick={handleSave}>
                {saving ? "Saving…" : (
                  <>
                    <Check className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" disabled={isBusy} onClick={cancelEditing}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" disabled={isBusy} onClick={startEditing}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" disabled={isBusy} onClick={handleDelete}>
                {deleting ? "Deleting…" : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/chat" state={{ question: `Tell me about the note titled "${note!.title}"` }}>
                  <MessageSquare className="h-4 w-4" />
                  Ask AI
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {note!.category ? <Badge variant="outline">{note!.category}</Badge> : null}
            <span className="text-xs text-muted-foreground">
              Updated {formatRelativeDate(note!.updated_at)}
            </span>
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isBusy}
                maxLength={200}
                placeholder="Note title"
                className="text-lg font-semibold"
              />
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={isBusy}
                className="min-h-[200px]"
                placeholder="Note content"
              />
            </div>
          ) : (
            <>
              <CardTitle className="text-2xl">{note!.title}</CardTitle>
              {note!.summary ? <p className="text-sm text-muted-foreground">{note!.summary}</p> : null}
              {note!.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {note!.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? null : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {note!.content}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
