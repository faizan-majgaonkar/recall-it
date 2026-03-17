import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    timeStyle: "short",
  }).format(date);
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <article
          key={document.id}
          className="rounded-xl border bg-background p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {document.title}
              </h2>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="truncate">
                  Original file: {document.originalFileName}
                </p>
                <p>
                  Type: {document.mimeType} • Size:{" "}
                  {formatFileSize(document.fileSize)}
                </p>
                <p>Uploaded: {formatDate(document.createdAt)}</p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col justify-between h-full">
              <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                {document.processingStatus}
              </span>
              <Button
                render={
                  <Link href={`/documents/${document.id}`}>Open quiz</Link>
                }
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
