import { FormEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileUp } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadTabProps {
  label: string;
  accept: string;
  helpText: string;
  busyLabel: string;
  onUpload: (file: File) => Promise<{ id: number; title: string }>;
}

export function FileUploadTab({ label, accept, helpText, busyLabel, onUpload }: FileUploadTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: number; title: string } | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      return;
    }

    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const note = await onUpload(file);
      setCreated({ id: note.id, title: note.title });
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {created ? (
        <Alert>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Created note: <strong>{created.title}</strong>
            </span>
            <Button asChild size="sm" variant="outline">
              <Link to={`/notes/${created.id}`}>View note</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
            file && "border-primary/50 bg-primary/5",
          )}
        >
          <FileUp className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{helpText}</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={busy}
            className="mt-4 max-w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>

        {busy ? (
          <div className="space-y-2">
            <Progress value={66} className="animate-pulse" />
            <p className="text-xs text-muted-foreground">{busyLabel}</p>
          </div>
        ) : null}

        <Button type="submit" disabled={busy || !file}>
          {busy ? "Processing…" : "Upload"}
        </Button>
      </form>
    </div>
  );
}
