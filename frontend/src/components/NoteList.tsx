import type { Note } from "../types";
import { NoteCard } from "./NoteCard";

interface NoteListProps {
  notes: Note[];
  heading: string;
}

export function NoteList({ notes, heading }: NoteListProps) {
  return (
    <section>
      <h2>{heading}</h2>
      {notes.length === 0 ? <p>No notes to display.</p> : null}
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </section>
  );
}
