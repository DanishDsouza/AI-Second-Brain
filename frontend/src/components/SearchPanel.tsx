import { FormEvent, useState } from "react";

interface SearchPanelProps {
  onSearch: (query: string) => Promise<void>;
  onClear: () => void;
  disabled?: boolean;
  isSearchActive: boolean;
}

export function SearchPanel({
  onSearch,
  onClear,
  disabled = false,
  isSearchActive,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    await onSearch(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
      <h2>Semantic search</h2>
      <div style={{ marginBottom: "0.5rem" }}>
        <label htmlFor="search-query">Query</label>
        <br />
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
          style={{ width: "100%", maxWidth: "32rem" }}
        />
      </div>
      <button type="submit" disabled={disabled}>
        Search
      </button>{" "}
      {isSearchActive && (
        <button type="button" onClick={onClear} disabled={disabled}>
          Show all notes
        </button>
      )}
    </form>
  );
}
