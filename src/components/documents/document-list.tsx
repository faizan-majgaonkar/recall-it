import Link from "next/link";
import { cn } from "@/lib/utils";
import { RetryProcessButton } from "@/components/documents/retry-process-button";

type DocumentListItem = {
  id: string;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  processingStatus: string;
  processingError: string | null;
  createdAt: Date;
};

type DocumentListProps = {
  documents: DocumentListItem[];
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

function fileTypeLabel(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "DOCX";
  if (mimeType === "text/plain") return "TXT";
  return "File";
}

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Processing…",
  extracting_text: "Extracting text…",
  text_extracted: "Text extracted",
  chunking: "Chunking…",
  chunked: "Chunked",
  extracting_concepts: "Extracting concepts…",
  concepts_extracted: "Ready",
  embedding: "Generating embeddings…",
  embedded: "Ready",
  failed: "Failed",
  processing_failed: "Failed",
  chunking_failed: "Failed",
  extraction_failed: "Failed",
  concept_extraction_failed: "Failed",
  embedding_failed: "Failed",
};

const READY_STATUSES = new Set(["concepts_extracted", "embedded"]);

const PROCESSING_STATUSES = new Set([
  "uploaded",
  "extracting_text",
  "text_extracted",
  "chunking",
  "chunked",
  "extracting_concepts",
  "embedding",
]);

function isFailedStatus(status: string) {
  return status.includes("fail");
}

function statusBadgeClass(status: string) {
  if (isFailedStatus(status)) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400";
  }
  if (READY_STATUSES.has(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  if (PROCESSING_STATUSES.has(status)) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
  }
  return "border-border bg-muted/40 text-muted-foreground";
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const isReady = READY_STATUSES.has(document.processingStatus);
        const isProcessing = PROCESSING_STATUSES.has(
          document.processingStatus,
        );
        const isFailed = isFailedStatus(document.processingStatus);

        return (
          <article
            key={document.id}
            className="rounded-xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <h2 className="truncate font-semibold tracking-tight">
                  {document.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-medium text-foreground">
                    {fileTypeLabel(document.mimeType)}
                  </span>
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>{formatDate(document.createdAt)}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    statusBadgeClass(document.processingStatus),
                  )}
                >
                  {isProcessing && (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {STATUS_LABELS[document.processingStatus] ??
                    document.processingStatus}
                </span>

                {isReady ? (
                  <Link
                    href={`/documents/${document.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                  >
                    Open →
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-border bg-muted px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm"
                  >
                    Open →
                  </span>
                )}
              </div>
            </div>

            {isProcessing && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-medium">
                    Your document is being processed.
                  </span>{" "}
                  This typically takes 5–10 minutes. This page will update
                  automatically.
                </p>
              </div>
            )}

            {isFailed && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="min-w-0 flex-1 text-xs text-red-700 dark:text-red-300">
                  <span className="font-medium">
                    Processing failed.
                  </span>{" "}
                  {document.processingError ??
                    "An unexpected error occurred while processing your document."}
                </p>
                <RetryProcessButton documentId={document.id} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export { PROCESSING_STATUSES };
