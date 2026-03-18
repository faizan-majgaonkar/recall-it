import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";
import { GenerateQuizForm } from "@/components/quiz/generate-quiz-form";
import { QuestionBankList } from "@/components/quiz/question-bank-list";
import { TutorCtaButton } from "@/components/tutor/tutor-cta-button";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { findDocumentByIdForUser } from "@/server/repositories/document.repository";
import { listQuestionBanksByDocumentId } from "@/server/repositories/question.repository";

type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Processing…",
  extracting_text: "Extracting text…",
  text_extracted: "Text extracted",
  chunking: "Chunking…",
  chunked: "Chunked",
  extracting_concepts: "Extracting concepts…",
  concepts_extracted: "Ready for quiz",
  embedding: "Generating embeddings…",
  embedded: "Ready for tutor",
  failed: "Failed",
  processing_failed: "Processing failed",
  chunking_failed: "Chunking failed",
  extraction_failed: "Extraction failed",
  concept_extraction_failed: "Concept extraction failed",
  embedding_failed: "Embedding failed",
};

function statusBadgeClass(status: string) {
  if (status.includes("fail") || status.includes("error")) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400";
  }
  if (status === "embedded") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400";
  }
  if (status === "concepts_extracted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  if (
    status === "extracting_text" ||
    status === "chunking" ||
    status === "extracting_concepts" ||
    status === "embedding"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
  }
  return "border-border bg-muted/40 text-muted-foreground";
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const user = await requireAuthenticatedUser();
  const { id } = await params;

  const document = await findDocumentByIdForUser({
    documentId: id,
    userId: user.id,
  });

  if (!document) {
    notFound();
  }

  const questionBanks = await listQuestionBanksByDocumentId(document.id);
  const canGenerateQuiz =
    document.processingStatus === "concepts_extracted" ||
    document.processingStatus === "embedded";

  return (
    <main className="py-10">
      <Container size="xl">
        <div className="space-y-8">
          {/* Header */}
          <section className="space-y-3">
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to documents
            </Link>
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {document.title}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  {document.originalFileName}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium",
                  statusBadgeClass(document.processingStatus),
                )}
              >
                {STATUS_LABELS[document.processingStatus] ??
                  document.processingStatus}
              </span>
            </div>
          </section>

          {/* AI Tutor */}
          {document.processingStatus === "embedded" && (
            <section className="rounded-xl border bg-background p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight">
                    AI Tutor
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Study this document with an AI tutor that answers using your
                    source material.
                  </p>
                </div>
                <TutorCtaButton
                  documentId={document.id}
                  initialStatus={document.processingStatus}
                />
              </div>
            </section>
          )}

          {/* Generate quiz */}
          <section className="rounded-xl border bg-background p-6 shadow-sm">
            <div className="mb-5 space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Generate quiz
              </h2>
              <p className="text-sm text-muted-foreground">
                Create a concept-grounded quiz from your document. Questions are
                built from the extracted concepts and source chunks.
              </p>
            </div>

            {canGenerateQuiz ? (
              <GenerateQuizForm documentId={document.id} />
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Quiz generation is available once concept extraction completes.
                Current status:{" "}
                <span className="font-medium text-foreground">
                  {STATUS_LABELS[document.processingStatus] ??
                    document.processingStatus}
                </span>
              </div>
            )}
          </section>

          {/* Quiz banks */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Quiz banks
              </h2>
              <p className="text-sm text-muted-foreground">
                Previously generated quizzes for this document.
              </p>
            </div>
            <QuestionBankList questionBanks={questionBanks} />
          </section>
        </div>
      </Container>
    </main>
  );
}
