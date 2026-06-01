import { FormEvent, useRef, useState } from "react";

interface ImageUploadFormProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function ImageUploadForm({ onUpload, disabled = false }: ImageUploadFormProps) {
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
      <h2>Upload image (OCR)</h2>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
        PNG, JPG, JPEG, or WEBP. Screenshots, photos, and scans with readable text.
      </p>
      <div style={{ marginBottom: "0.5rem" }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          disabled={disabled}
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <button type="submit" disabled={disabled || !selectedFile}>
        {disabled ? "Processing image (OCR + AI)…" : "Upload image"}
      </button>
    </form>
  );
}
