import { Container } from "@/components/layout/container";

export default function DocumentsPage() {
  return (
    <main className="py-10">
      <Container size="xl">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Upload and manage your study documents.
          </p>
        </div>
      </Container>
    </main>
  );
}
