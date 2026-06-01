import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, Send } from "lucide-react";

import * as api from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { ChatResponse } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatResponse["sources"];
}

function newMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatPage() {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  const initialQuestion =
    typeof location.state === "object" &&
    location.state !== null &&
    "question" in location.state &&
    typeof (location.state as { question?: unknown }).question === "string"
      ? (location.state as { question: string }).question
      : "";

  useEffect(() => {
    if (!seeded && initialQuestion) {
      setQuestion(initialQuestion);
      setSeeded(true);
    }
  }, [initialQuestion, seeded]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function submitQuestion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: newMessageId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const response = await api.chat({ question: trimmed });
      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat request failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submitQuestion(question);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:h-[calc(100vh-7rem)]">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ScrollArea className="flex-1 rounded-lg border border-border bg-card/30">
        <div className="space-y-6 p-4 md:p-6">
          {messages.length === 0 && !loading ? (
            <div className="mx-auto max-w-lg py-12 text-center">
              <h2 className="text-lg font-semibold">Ask your knowledge base</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Questions are answered using semantic search over your notes, PDFs, and
                uploads. Sources appear below each answer.
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground"
                  : "mr-auto max-w-[95%] space-y-3"
              }
            >
              {message.role === "assistant" ? (
                <>
                  <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.sources && message.sources.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="w-full text-xs text-muted-foreground">Sources</span>
                      {message.sources.map((source) => (
                        <Link key={source.id} to={`/notes/${source.id}`}>
                          <Badge variant="secondary" className="font-normal hover:bg-secondary/80">
                            {source.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          ))}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching notes and generating answer…
            </div>
          ) : null}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 rounded-lg border border-border bg-card p-3 shadow-sm"
      >
        <div className="flex gap-2">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about your notes…"
            disabled={loading}
            rows={2}
            className="min-h-[52px] resize-none"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitQuestion(question);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-[52px] w-[52px] shrink-0"
            disabled={loading || !question.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Enter to send · Shift+Enter for newline</p>
      </form>
    </div>
  );
}
