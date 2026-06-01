import { useSearchParams } from "react-router-dom";

import { TextNoteTab } from "@/features/upload/TextNoteTab";
import { FileUploadTab } from "@/features/upload/FileUploadTab";
import * as api from "@/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = ["text", "pdf", "image"] as const;
type UploadTab = (typeof tabs)[number];

function parseTab(value: string | null): UploadTab {
  if (value === "pdf" || value === "image") {
    return value;
  }
  return "text";
}

export default function UploadPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  function setTab(tab: UploadTab) {
    setSearchParams({ tab });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add content to your knowledge base. Files are processed in memory and not stored on disk.
      </p>

      <Tabs value={activeTab} onValueChange={(value) => setTab(parseTab(value))}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text">Text note</TabsTrigger>
          <TabsTrigger value="pdf">PDF</TabsTrigger>
          <TabsTrigger value="image">Image OCR</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <TextNoteTab />
        </TabsContent>

        <TabsContent value="pdf">
          <FileUploadTab
            label="Upload PDF"
            accept="application/pdf,.pdf"
            helpText="Text is extracted with PyMuPDF, then analyzed and indexed for search."
            busyLabel="Extracting text, running AI analysis, and indexing…"
            onUpload={api.uploadPdf}
          />
        </TabsContent>

        <TabsContent value="image">
          <FileUploadTab
            label="Upload image"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            helpText="PNG, JPG, JPEG, or WEBP. OCR extracts text, then AI analysis and indexing run."
            busyLabel="Running OCR, AI analysis, and indexing…"
            onUpload={api.uploadImage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
