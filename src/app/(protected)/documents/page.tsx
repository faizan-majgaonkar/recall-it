import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  DocumentList,
  PROCESSING_STATUSES,
} from "@/components/documents/document-list";
import { DocumentListAutoRefresh } from "@/components/documents/document-list-auto-refresh";
import { EmptyDocumentsState } from "@/components/documents/empty-documents-state";
import { getCurrentUserDocuments } from "@/server/modules/documents/documents.service";

export default async function DocumentsPage() {
  const documents = await getCurrentUserDocuments();

  const hasProcessingDocuments = documents.some((doc) =>
    PROCESSING_STATUSES.has(doc.processingStatus),
  );

  return (
    <main className="py-10">
      <Container size="xl">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Documents
              </h1>
              <p className="text-muted-foreground">
                Manage your uploaded study material and track its processing
                status.
              </p>
            </div>

            <Button
              render={<Link href="/documents/upload">Upload document</Link>}
            />
          </div>

          {documents.length > 0 ? (
            <>
              {hasProcessingDocuments && <DocumentListAutoRefresh />}
              <DocumentList documents={documents} />
            </>
          ) : (
            <EmptyDocumentsState />
          )}
        </div>
      </Container>
    </main>
  );
}
