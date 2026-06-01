import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Library, MessageSquare, Search, Upload } from "lucide-react";

import * as api from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteCard } from "@/features/notes/NoteCard";
import type { Note } from "@/types";

const quickActions = [
  { title: "Add note", href: "/upload?tab=text", icon: Upload },
  { title: "Search", href: "/search", icon: Search },
  { title: "Ask AI", href: "/chat", icon: MessageSquare },
  { title: "All notes", href: "/notes", icon: Library },
] as const;

export default function DashboardPage() {
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

  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4);
  }, [notes]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      const key = note.category || "Uncategorized";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [notes]);

  return (
    <div className="space-y-8">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total notes</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? <Skeleton className="h-9 w-12" /> : notes.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? <Skeleton className="h-9 w-12" /> : categories.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Knowledge base</CardDescription>
            <CardTitle className="text-base font-medium">
              Semantic search and RAG chat over your indexed content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link to="/chat">Open AI Chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Button key={action.href} asChild variant="secondary" className="h-auto justify-start py-3">
              <Link to={action.href}>
                <action.icon className="h-4 w-4" />
                {action.title}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {!loading && categories.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Top categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(([name, count]) => (
              <span
                key={name}
                className="rounded-md border border-border bg-muted/40 px-3 py-1 text-sm"
              >
                {name} <span className="text-muted-foreground">({count})</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Recent notes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/notes">View all</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full" />
            ))}
          </div>
        ) : null}

        {!loading && recentNotes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No notes yet.{" "}
            <Link to="/upload" className="text-primary underline-offset-4 hover:underline">
              Upload your first note
            </Link>
            .
          </div>
        ) : null}

        {!loading && recentNotes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
