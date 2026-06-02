import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Library, Search, Upload } from "lucide-react";

import * as api from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteCard } from "@/features/notes/NoteCard";
import type { Note } from "@/types";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const uniqueCategories = useMemo(() => {
    const cats = new Set(notes.map((n) => n.category).filter(Boolean));
    return [...cats].sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const tagFrequency = useMemo(() => {
    const freq = new Map<string, number>();
    for (const note of notes) {
      const seen = new Set<string>();
      for (const tag of note.tags) {
        const key = tag.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          freq.set(key, (freq.get(key) ?? 0) + 1);
        }
      }
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [notes]);

  useEffect(() => {
    if (selectedCategory && !uniqueCategories.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [uniqueCategories, selectedCategory]);

  useEffect(() => {
    if (selectedTags.length > 0) {
      setSelectedTags((prev) => prev.filter((t) => tagFrequency.some(([tag]) => tag === t)));
    }
  }, [tagFrequency]);

  function handleTagClick(tag: string) {
    const normalized = tag.toLowerCase().trim();
    setSelectedTags((prev) =>
      prev.includes(normalized)
        ? prev.filter((t) => t !== normalized)
        : [...prev, normalized],
    );
  }

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (selectedCategory && note.category !== selectedCategory) return false;
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((t) => note.tags.some((nt) => nt.toLowerCase().trim() === t))
      )
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [
          note.title,
          note.summary,
          note.content.slice(0, 200),
          note.category,
          ...note.tags,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [notes, selectedCategory, selectedTags, searchQuery]);

  const hasActiveFilter = selectedCategory !== null || selectedTags.length > 0 || searchQuery !== "";

  function clearFilters() {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTags([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {loading ? null : (
            <p className="text-sm text-muted-foreground">
              {hasActiveFilter
                ? `Showing ${filteredNotes.length} of ${notes.length} note${notes.length === 1 ? "" : "s"}`
                : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilter ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
          <Button asChild>
            <Link to="/upload?tab=text">
              <Upload className="h-4 w-4" />
              Add note
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && notes.length > 0 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes…"
            className="pl-9"
          />
        </div>
      ) : null}

      {!loading && notes.length > 0 && uniqueCategories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Categories</span>
          {uniqueCategories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedCategory(selectedCategory === category ? null : category)
              }
            >
              {category}
            </Badge>
          ))}
        </div>
      ) : null}

      {!loading && notes.length > 0 && tagFrequency.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tags</span>
          {tagFrequency.map(([tag, count]) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                )
              }
            >
              {tag} ({count})
            </Badge>
          ))}
        </div>
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

      {!loading && notes.length > 0 && filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No matching notes</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            No notes match the current search or filters. Try different keywords or clear filters.
          </p>
        </div>
      ) : null}

      {!loading && notes.length > 0 && filteredNotes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} onTagClick={handleTagClick} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
