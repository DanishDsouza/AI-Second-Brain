import type { Note, NoteCreate, SearchQuery } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string | { msg: string }[] };
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((item) => item.msg).join("; ");
      }
    } catch {
      // use statusText
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function listNotes(): Promise<Note[]> {
  return request<Note[]>("/notes");
}

export function getNote(noteId: number): Promise<Note> {
  return request<Note>(`/notes/${noteId}`);
}

export function createNote(note: NoteCreate): Promise<Note> {
  return request<Note>("/notes", {
    method: "POST",
    body: JSON.stringify(note),
  });
}

export function searchNotes(search: SearchQuery): Promise<Note[]> {
  return request<Note[]>("/search", {
    method: "POST",
    body: JSON.stringify(search),
  });
}

export async function uploadPdf(file: File): Promise<Note> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload/pdf`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string | { msg: string }[] };
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((item) => item.msg).join("; ");
      }
    } catch {
      // use statusText
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return (await response.json()) as Note;
}

export async function uploadImage(file: File): Promise<Note> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload/image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string | { msg: string }[] };
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((item) => item.msg).join("; ");
      }
    } catch {
      // use statusText
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return (await response.json()) as Note;
}
