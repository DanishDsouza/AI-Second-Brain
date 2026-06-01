import { FormEvent, useState } from "react";

interface NoteFormProps {
  onSubmit: (title: string, content: string) => Promise<void>;
  disabled?: boolean;
}

export function NoteForm({ onSubmit, disabled = false }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      return;
    }

    await onSubmit(trimmedTitle, trimmedContent);
    setTitle("");
    setContent("");
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
      <h2>Create note</h2>
      <div style={{ marginBottom: "0.5rem" }}>
        <label htmlFor="note-title">Title</label>
        <br />
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={disabled}
          maxLength={200}
          style={{ width: "100%", maxWidth: "32rem" }}
        />
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <label htmlFor="note-content">Content</label>
        <br />
        <textarea
          id="note-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={disabled}
          rows={6}
          style={{ width: "100%", maxWidth: "32rem" }}
        />
      </div>
      <button type="submit" disabled={disabled}>
        {disabled ? "Creating (AI analysis may take a minute)…" : "Create note"}
      </button>
    </form>
  );
}
