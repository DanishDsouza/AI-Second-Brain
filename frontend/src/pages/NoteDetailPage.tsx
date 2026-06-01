import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";

import * as api from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate } from "@/lib/formatDate";
import type { Note } from "@/types";

export default function NoteDetailPage() {
  const { noteId } = useParams();
  const id = Number(noteId);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !note) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link to="/notes">
            <ArrowLeft className="h-4 w-4" />
            Back to notes
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/chat" state={{ question: `Tell me about the note titled "${note.title}"` }}>
            <MessageSquare className="h-4 w-4" />
            Ask AI
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {note.category ? <Badge variant="outline">{note.category}</Badge> : null}
            <span className="text-xs text-muted-foreground">
              Updated {formatRelativeDate(note.updated_at)}
            </span>
          </div>
          <CardTitle className="text-2xl">{note.title}</CardTitle>
          {note.summary ? <p className="text-sm text-muted-foreground">{note.summary}</p> : null}
          {note.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {note.content}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
