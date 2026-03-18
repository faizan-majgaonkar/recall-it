"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TutorCtaButtonProps = {
  documentId: string;
  initialStatus: string;
};

export function TutorCtaButton({
  documentId,
  initialStatus,
}: TutorCtaButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isTriggering, setIsTriggering] = useState(false);

  const isEmbedding = status === "embedding" || isTriggering;
  const isEmbedded = status === "embedded";

  async function handleSetupClick() {
    setIsTriggering(true);
    setStatus("embedding");

    try {
      await fetch(`/api/documents/${documentId}/embed`, { method: "POST" });
      router.refresh();
    } catch {
      // Status is already showing "embedding" — background job will update DB
    } finally {
      setIsTriggering(false);
    }
  }

  if (isEmbedded) {
    return (
      <a
        href={`/documents/${documentId}/tutor`}
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
