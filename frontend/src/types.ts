export interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
  content: string;
}

export interface SearchQuery {
  query: string;
  limit?: number;
}
