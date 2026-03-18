import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SessionHistoryList } from "@/components/quiz/session-history-list";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { findQuestionBankByIdForUser } from "@/server/repositories/question.repository";
import { listSessionsByQuestionBankId } from "@/server/repositories/quiz-session.repository";
import { listConceptsByQuestionBankId } from "@/server/repositories/concept.repository";

type QuizPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

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

  const [sessions, concepts] = await Promise.all([
    listSessionsByQuestionBankId(questionBank.id),
    listConceptsByQuestionBankId(questionBank.id),
  ]);

  const bestScore =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.score ?? 0))
      : null;

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
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {questionBank.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(questionBank.createdAt)}
                </p>
              </div>
              <Link
                href={`/quizzes/${questionBank.id}/attempt`}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Start quiz →
              </Link>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-background p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Questions
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {questionBank.questionCount}
              </p>
            </div>

            <div className="rounded-xl border bg-background p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Attempts
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {sessions.length}
              </p>
            </div>

            <div className="col-span-2 rounded-xl border bg-background p-5 shadow-sm sm:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Best score
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {bestScore !== null ? `${bestScore}%` : "—"}
              </p>
            </div>
          </section>

          {/* Concepts covered */}
          {concepts.length > 0 && (
            <section className="rounded-xl border bg-background p-5 shadow-sm space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Concepts covered
              </p>
              <div className="flex flex-wrap gap-2">
                {concepts.map((concept) => (
                  <span
                    key={concept.id}
                    className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {concept.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Past attempts */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Past attempts
              </h2>
              <p className="text-sm text-muted-foreground">
                Your previous attempts on this quiz, most recent first.
              </p>
            </div>
            <SessionHistoryList sessions={sessions} />
          </section>
        </div>
      </Container>
    </main>
  );
}
