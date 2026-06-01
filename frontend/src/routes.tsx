import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import LegacyAppPage from "@/pages/LegacyAppPage";
import NoteDetailPage from "@/pages/NoteDetailPage";
import NotesPage from "@/pages/NotesPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <PlaceholderPage
              title="Dashboard"
              description="Phase 7.4 will add stats, quick actions, and recent notes."
            />
          }
        />
        <Route path="notes" element={<NotesPage />} />
        <Route path="notes/:noteId" element={<NoteDetailPage />} />
        <Route
          path="search"
          element={
            <PlaceholderPage
              title="Search"
              description="Phase 7.2 will add dedicated semantic search."
            />
          }
        />
        <Route
          path="chat"
          element={
            <PlaceholderPage
              title="AI Chat"
              description="Phase 7.3 will add RAG chat with source citations."
            />
          }
        />
        <Route path="upload" element={<LegacyAppPage />} />
        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="Settings"
              description="Phase 7.4 will add API and appearance settings."
            />
          }
        />
        <Route path="legacy" element={<LegacyAppPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
