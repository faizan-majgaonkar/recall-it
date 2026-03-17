import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { GenerateQuizForm } from "@/components/quiz/generate-quiz-form";
import { QuestionBankList } from "@/components/quiz/question-bank-list";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { findDocumentByIdForUser } from "@/server/repositories/document.repository";
import { listQuestionBanksByDocumentId } from "@/server/repositories/question.repository";

type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

  const canGenerateQuiz = document.processingStatus === "concepts_extracted";

  return (
    <main className="py-10">
      <Container size="xl">
        <div className="space-y-8">
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {document.title}
            </h1>
            <p className="text-muted-foreground">
              File: {document.originalFileName}
            </p>
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-medium capitalize text-foreground">
                {document.processingStatus}
              </span>
            </p>
          </section>

          <section className="rounded-xl border bg-background p-6 shadow-sm">
            <div className="mb-5 space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Generate quiz
              </h2>
              <p className="text-sm text-muted-foreground">
                Create a grounded quiz from the processed concepts and chunks of
                this document.
              </p>
            </div>

            {canGenerateQuiz ? (
              <GenerateQuizForm documentId={document.id} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Quiz generation becomes available after concept extraction is
                complete.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Existing quiz banks
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
