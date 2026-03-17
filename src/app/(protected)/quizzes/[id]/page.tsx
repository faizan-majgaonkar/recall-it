import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  findQuestionBankByIdForUser,
  listQuestionsWithOptionsByQuestionBankId,
} from "@/server/repositories/question.repository";

type QuizPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuizPage({ params }: QuizPageProps) {
  const user = await requireAuthenticatedUser();
  const { id } = await params;

  const questionBank = await findQuestionBankByIdForUser({
    questionBankId: id,
    userId: user.id,
  });

  if (!questionBank) {
    notFound();
  }

  const questions = await listQuestionsWithOptionsByQuestionBankId(
    questionBank.id,
  );

  return (
    <main className="py-10">
      <Container size="xl">
        <div className="space-y-8">
          {/* Header */}
          <section className="space-y-3">
            <Link
              href={`/documents/${questionBank.documentId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to document
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {questionBank.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {questions.length} question{questions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </section>

          {questions.length > 0 ? (
            <QuizRunner
              questionBankId={questionBank.id}
              questions={questions.map((q) => ({
                id: q.id,
                prompt: q.prompt,
                difficulty: q.difficulty,
                options: q.options.map((o) => ({
                  id: o.id,
                  optionKey: o.optionKey,
                  text: o.text,
                })),
              }))}
            />
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              This quiz does not contain any questions yet.
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
