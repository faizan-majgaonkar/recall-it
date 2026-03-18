import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TutorChat } from "@/components/tutor/tutor-chat";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { findDocumentByIdForUser } from "@/server/repositories/document.repository";
import { listConceptsByDocumentId } from "@/server/repositories/concept.repository";

type TutorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    quizSessionId?: string;
    concepts?: string;
  }>;
};

export default async function TutorPage({
  params,
  searchParams,
}: TutorPageProps) {
  const user = await requireAuthenticatedUser();
  const { id } = await params;
  const search = await searchParams;

  const document = await findDocumentByIdForUser({
    documentId: id,
    userId: user.id,
  });

  if (!document) {
    notFound();
  }

  if (document.processingStatus !== "embedded") {
    redirect(`/documents/${document.id}`);
  }

  const weakConceptIds = search.concepts
    ? search.concepts.split(",").filter(Boolean)
    : [];

  let weakConceptNames: string[] = [];
  if (weakConceptIds.length > 0) {
    const allConcepts = await listConceptsByDocumentId(document.id);
    const idSet = new Set(weakConceptIds);
    weakConceptNames = allConcepts
      .filter((c) => idSet.has(c.id))
      .map((c) => c.name);
  }

  const backHref = search.quizSessionId
    ? `/quizzes/sessions/${search.quizSessionId}`
    : `/documents/${document.id}`;
  const backLabel = search.quizSessionId
    ? "Back to results"
    : "Back to document";

  return (
    <main className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            >
              ← {backLabel}
            </Link>
            <h1 className="truncate text-sm font-semibold tracking-tight sm:text-lg">
              AI Tutor — {document.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Chat fills remaining space */}
      <div className="min-h-0 flex-1">
        <TutorChat
          documentId={document.id}
          quizSessionId={search.quizSessionId}
          weakConceptIds={weakConceptIds}
          weakConceptNames={weakConceptNames}
        />
      </div>
    </main>
  );
}
