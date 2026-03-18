"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RetryProcessButtonProps = {
  documentId: string;
};

export function RetryProcessButton({ documentId }: RetryProcessButtonProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    setIsRetrying(true);

    try {
      fetch(`/api/documents/${documentId}/process`, {
        method: "POST",
      }).catch(() => {});

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.refresh();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={isRetrying}
      className="ml-auto shrink-0 rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-950/80"
    >
      {isRetrying ? "Retrying…" : "Retry"}
    </button>
  );
}
