import type { ChatRequest, ChatResponse, Note, NoteCreate, NoteUpdate, SearchQuery } from "./types";

const API_BASE_STORAGE_KEY = "ai-second-brain-api-base";
const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

function getApiBase(): string {
  try {
    const stored = localStorage.getItem(API_BASE_STORAGE_KEY);
    if (stored?.trim()) {
      return stored.trim();
    }
  } catch {
    // private mode / disabled storage
  }
  return DEFAULT_API_BASE;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
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

export function updateNote(noteId: number, data: NoteUpdate): Promise<Note> {
  return request<Note>(`/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteNote(noteId: number): Promise<void> {
  return request<void>(`/notes/${noteId}`, {
    method: "DELETE",
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

  const response = await fetch(`${getApiBase()}/upload/pdf`, {
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

  const response = await fetch(`${getApiBase()}/upload/image`, {
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

export function chat(payload: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
