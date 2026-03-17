import Link from "next/link";
import { cn } from "@/lib/utils";

type DocumentListItem = {
  id: string;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  processingStatus: string;
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
  uploaded: "Uploaded",
  extracting_text: "Extracting text…",
  text_extracted: "Text extracted",
  chunking: "Chunking…",
  chunked: "Chunked",
  extracting_concepts: "Extracting concepts…",
  concepts_extracted: "Ready",
  failed: "Failed",
};

function statusBadgeClass(status: string) {
  if (status.includes("fail") || status.includes("error")) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400";
  }
  if (status === "concepts_extracted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  if (
    status === "extracting_text" ||
    status === "chunking" ||
    status === "extracting_concepts"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
  }
  return "border-border bg-muted/40 text-muted-foreground";
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <article
          key={document.id}
          className="rounded-xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Info */}
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

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  statusBadgeClass(document.processingStatus),
                )}
              >
                {STATUS_LABELS[document.processingStatus] ??
                  document.processingStatus}
              </span>

              <Link
                href={`/documents/${document.id}`}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
              >
                Open →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
