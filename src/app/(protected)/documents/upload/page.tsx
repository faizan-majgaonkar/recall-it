import { Container } from "@/components/layout/container";
import { UploadForm } from "@/components/documents/upload-form";

export default function UploadDocumentPage() {
  return (
    <main className="py-10">
      <Container size="sm">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Upload document
            </h1>
            <p className="text-muted-foreground">
              Upload a study document to begin processing concepts and preparing
              quiz generation.
            </p>
          </div>

          <div className="rounded-xl border bg-background p-6 shadow-sm">
            <UploadForm />
          </div>
        </div>
      </Container>
    </main>
  );
}
