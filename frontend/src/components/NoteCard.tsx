import type { Note } from "../types";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <article style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "0.75rem" }}>
      <h3 style={{ margin: "0 0 0.5rem" }}>{note.title}</h3>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>Category:</strong> {note.category || "(none)"}
      </p>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>Tags:</strong> {note.tags.length > 0 ? note.tags.join(", ") : "(none)"}
      </p>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>Summary:</strong> {note.summary || "(none)"}
      </p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          margin: "0.5rem 0 0",
          fontFamily: "inherit",
        }}
      >
        {note.content}
      </pre>
    </article>
  );
}
