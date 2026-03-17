import Link from "next/link";

export function EmptyDocumentsState() {
  return (
    <div className="rounded-xl border border-dashed bg-background py-16 text-center">
      <div className="mx-auto max-w-sm space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
          📄
        </div>
        <div className="space-y-1.5">
          <h2 className="font-semibold tracking-tight">No documents yet</h2>
          <p className="text-sm text-muted-foreground">
            Upload your first study document to start building quizzes and
            diagnosing your understanding.
          </p>
        </div>
        <Link
          href="/documents/upload"
          className="inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Upload a document
        </Link>
      </div>
    </div>
  );
}
