import { FormEvent, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_KEY = "ai-second-brain-api-base";
const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

function readStoredApiBase(): string {
  try {
    return localStorage.getItem(API_BASE_KEY) ?? DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

export default function SettingsPage() {
  const [apiBase, setApiBase] = useState(readStoredApiBase);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiBase(readStoredApiBase());
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = apiBase.trim() || DEFAULT_API_BASE;
    try {
      localStorage.setItem(API_BASE_KEY, trimmed);
    } catch {
      // ignore quota / private mode
    }
    setApiBase(trimmed);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    try {
      localStorage.removeItem(API_BASE_KEY);
    } catch {
      // ignore
    }
    setApiBase(DEFAULT_API_BASE);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API connection</CardTitle>
          <CardDescription>
            Override the backend URL used by the app. Default is{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{DEFAULT_API_BASE}</code> (Vite
            proxy in dev).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-base">API base URL</Label>
              <Input
                id="api-base"
                value={apiBase}
                onChange={(event) => setApiBase(event.target.value)}
                placeholder="/api"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset to default
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {saved ? (
        <Alert>
          <AlertDescription>
            Settings saved. Reload the page for API changes to take effect everywhere.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Dark theme is enabled by default for this release.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Light mode and system preference sync are planned for a future update.
        </CardContent>
      </Card>
    </div>
  );
}
