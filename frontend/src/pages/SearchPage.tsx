import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Search } from "lucide-react";

import * as api from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteCard } from "@/features/notes/NoteCard";
import type { Note } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Note[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setResults(await api.searchNotes({ query: trimmed, limit: 5 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setQuery("");
    setResults(null);
    setError(null);
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Semantic search</h2>
        <p className="text-sm text-muted-foreground">
          Find notes by meaning across manual entries, PDFs, and scanned images.
        </p>
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your knowledge base…"
            disabled={loading}
            className="h-11"
          />
          <Button type="submit" disabled={loading || !query.trim()} className="h-11 shrink-0">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>
        {results !== null ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Clear results
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      ) : null}

      {!loading && results !== null && results.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No matching notes. Try different keywords or add more content via Upload Center.
        </p>
      ) : null}

      {!loading && results !== null && results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/chat" state={{ question: query }}>
                <MessageSquare className="h-4 w-4" />
                Ask AI about these
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
