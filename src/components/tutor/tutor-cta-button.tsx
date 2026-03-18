"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TutorCtaButtonProps = {
  documentId: string;
  initialStatus: string;
  quizSessionId?: string;
  weakConceptIds?: string[];
};

export function TutorCtaButton({
  documentId,
  initialStatus,
  quizSessionId,
  weakConceptIds,
}: TutorCtaButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isTriggering, setIsTriggering] = useState(false);

  const isEmbedding = status === "embedding" || isTriggering;
  const isEmbedded = status === "embedded";

  function buildTutorUrl() {
    const params = new URLSearchParams();
    if (quizSessionId) params.set("quizSessionId", quizSessionId);
    if (weakConceptIds && weakConceptIds.length > 0) {
      params.set("concepts", weakConceptIds.join(","));
    }
    const qs = params.toString();
    return `/documents/${documentId}/tutor${qs ? `?${qs}` : ""}`;
  }

  async function handleSetupClick() {
    setIsTriggering(true);
    setStatus("embedding");

    try {
      const response = await fetch(`/api/documents/${documentId}/embed`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("embedded");
        router.push(buildTutorUrl());
        return;
      }
    } catch {
      // Fall through
    } finally {
      setIsTriggering(false);
    }

    router.refresh();
  }

  if (isEmbedded) {
    return (
      <a
        href={buildTutorUrl()}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Open tutor →
      </a>
    );
  }

  if (isEmbedding) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed select-none">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
        Setting up…
      </span>
    );
  }

  return (
    <button
      onClick={handleSetupClick}
      className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
    >
      Open tutor →
    </button>
  );
}
