"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

type SourceChunk = {
  chunkId: string;
  sectionTitle: string | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sourceChunks?: SourceChunk[];
};

type TutorChatProps = {
  documentId: string;
  quizSessionId?: string;
  weakConceptIds: string[];
  weakConceptNames: string[];
};

export function TutorChat({
  documentId,
  quizSessionId,
  weakConceptIds,
  weakConceptNames,
}: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialised = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollAreaRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (hasInitialised.current) return;
    hasInitialised.current = true;
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startSession() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/documents/${documentId}/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          quizSessionId: quizSessionId || undefined,
          weakConceptIds:
            weakConceptIds.length > 0 ? weakConceptIds : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to start tutor session");
        return;
      }

      setSessionId(data.sessionId);
      setMessages([
        {
          role: "assistant",
          content: data.reply,
          sourceChunks: data.sourceChunks,
        },
      ]);
    } catch {
      setError("Failed to connect to the tutor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/documents/${documentId}/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          sessionId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to get a response");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          sourceChunks: data.sourceChunks,
        },
      ]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Weak concepts banner */}
      {weakConceptNames.length > 0 && (
        <div className="shrink-0 border-b bg-amber-50/60 px-4 py-2 dark:bg-amber-950/20 sm:px-6">
          <p className="mx-auto max-w-3xl text-xs text-amber-700 dark:text-amber-400">
            <span className="font-medium">Focusing on:</span>{" "}
            {weakConceptNames.join(" · ")}
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="space-y-5">
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}

            {isLoading && messages.length > 0 && <TypingIndicator />}

            {isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
                <TypingDots />
                <p className="text-sm">Setting up your tutor session…</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            disabled={isLoading || !sessionId}
            className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !sessionId || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 sm:h-5 sm:w-5"
            >
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/40" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:h-8 sm:w-8 sm:text-xs">
        AI
      </div>
      <div className="rounded-2xl rounded-tl-sm border bg-background px-4 py-3 shadow-sm">
        <TypingDots />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";
  const sources = message.sourceChunks?.filter((c) => c.sectionTitle) ?? [];

  return (
    <div className={cn("flex gap-2 sm:gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:h-8 sm:w-8 sm:text-xs",
          isUser
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isUser ? "You" : "AI"}
      </div>

      <div
        className={cn(
          "min-w-0 max-w-[88%] space-y-1.5 sm:max-w-[80%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:px-4 sm:py-3",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border bg-background text-foreground",
          )}
        >
          <div
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{
              __html: message.content.replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>",
              ),
            }}
          />
        </div>

        {!isUser && sources.length > 0 && (
          <div className="pl-1">
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-[11px] text-muted-foreground/70 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
            >
              {showSources
                ? "Hide sources"
                : `${sources.length} source${sources.length !== 1 ? "s" : ""}`}
            </button>

            {showSources && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {sources.map((source, i) => (
                  <span
                    key={i}
                    className="inline-flex rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {source.sectionTitle}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
