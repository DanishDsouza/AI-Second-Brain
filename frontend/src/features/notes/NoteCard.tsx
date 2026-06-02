import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/formatDate";
import type { Note } from "@/types";

interface NoteCardProps {
  note: Note;
  onTagClick?: (tag: string) => void;
}

export function NoteCard({ note, onTagClick }: NoteCardProps) {
  const preview =
    note.summary || (note.content.length > 160 ? `${note.content.slice(0, 160)}…` : note.content);

  return (
    <Link to={`/notes/${note.id}`} className="block transition-opacity hover:opacity-90">
      <Card className="h-full">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">{note.title}</CardTitle>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeDate(note.updated_at)}
            </span>
          </div>
          {note.category ? <Badge variant="outline">{note.category}</Badge> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription className="line-clamp-3 text-sm">{preview}</CardDescription>
          {note.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer font-normal"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onTagClick?.(tag);
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
