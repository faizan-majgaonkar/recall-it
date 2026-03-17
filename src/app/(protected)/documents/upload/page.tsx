import Link from "next/link";
import { Container } from "@/components/layout/container";
import { UploadForm } from "@/components/documents/upload-form";

export default function UploadDocumentPage() {
  return (
    <main className="py-10">
      <Container size="sm">
        <div className="space-y-6">
          <div className="space-y-4">
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to documents
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                Upload document
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload a study document to begin processing concepts and
                generating quizzes.
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-7 shadow-sm">
            <UploadForm />
          </div>
        </div>
      </Container>
    </main>
  );
}
