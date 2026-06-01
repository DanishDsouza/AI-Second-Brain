import { FormEvent, useRef, useState } from "react";

interface PdfUploadFormProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function PdfUploadForm({ onUpload, disabled = false }: PdfUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedFile) {
      return;
    }

    await onUpload(selectedFile);
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
      <h2>Upload PDF</h2>
      <div style={{ marginBottom: "0.5rem" }}>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <button type="submit" disabled={disabled || !selectedFile}>
        {disabled ? "Processing PDF…" : "Upload PDF"}
      </button>
    </form>
  );
}
