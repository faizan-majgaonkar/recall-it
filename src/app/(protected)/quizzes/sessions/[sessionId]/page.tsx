import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  findSessionByIdForUser,
  listAnswersBySessionId,
} from "@/server/repositories/quiz-session.repository";
import {
  findQuestionBankByIdForUser,
  listQuestionsWithOptionsByQuestionBankId,
} from "@/server/repositories/question.repository";
import { listConceptsByDocumentId } from "@/server/repositories/concept.repository";
import { computeWeakConcepts } from "@/server/modules/quiz-evaluation/weak-concept-detection.service";
import { cn } from "@/lib/utils";

type ResultsPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Great work";
  if (score >= 50) return "Keep practising";
  return "Needs revision";
}

export default async function QuizResultsPage({ params }: ResultsPageProps) {
  const user = await requireAuthenticatedUser();
  const { sessionId } = await params;

  const session = await findSessionByIdForUser({
    sessionId,
    userId: user.id,
  });

  if (!session) {
    notFound();
  }

  const questionBank = await findQuestionBankByIdForUser({
    questionBankId: session.questionBankId,
    userId: user.id,
  });

  if (!questionBank) {
    notFound();
  }

  const [questions, answers, concepts] = await Promise.all([
    listQuestionsWithOptionsByQuestionBankId(questionBank.id),
    listAnswersBySessionId(session.id),
    listConceptsByDocumentId(questionBank.documentId),
  ]);

  const answerByQuestionId = new Map(
    answers.map((a) => [a.questionId, a]),
  );

  const results = questions
    .map((question) => {
      const answer = answerByQuestionId.get(question.id);
      if (!answer) return null;

      const selectedOption = question.options.find(
        (o) => o.id === answer.selectedOptionId,
      );
      const correctOption = question.options.find((o) => o.isCorrect);

      return {
        id: question.id,
        prompt: question.prompt,
        difficulty: question.difficulty,
        isCorrect: answer.isCorrect,
        selectedOption: selectedOption ?? null,
        correctOption: correctOption ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const weakConcepts = computeWeakConcepts({
    answers,
    questions,
    concepts,
  });

  const score = session.score ?? 0;
  const correctCount = session.correctCount ?? 0;
  const totalQuestions = session.totalQuestions;

  return (
    <main className="py-10">
      <Container size="xl">
        <div className="space-y-8">
          {/* Header */}
          <section className="space-y-3">
            <Link
              href={`/quizzes/${questionBank.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to quiz
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight">
                {questionBank.title}
              </h1>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/quizzes/${questionBank.id}/attempt`}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                >
                  Retake quiz
                </Link>
                <Link
                  href={`/documents/${questionBank.documentId}`}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                >
                  Back to document
                </Link>
              </div>
            </div>
          </section>

          {/* Score card */}
          <section className="rounded-xl border bg-background p-8 shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
              <span
                className={cn(
                  "text-7xl font-bold tabular-nums leading-none tracking-tight",
                  scoreColor(score),
                )}
              >
                {score}%
              </span>
              <div className="space-y-1 pb-1">
                <p className="text-lg font-semibold">{scoreLabel(score)}</p>
                <p className="text-sm text-muted-foreground">
                  {correctCount} correct out of {totalQuestions} questions
                </p>
              </div>
            </div>
          </section>

          {/* Weak concepts */}
          {weakConcepts.length > 0 && (
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  Areas to review
                </h2>
                <p className="text-sm text-muted-foreground">
                  Concepts where you made the most mistakes, ranked by impact.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {weakConcepts.map((concept, index) => (
                  <div
                    key={concept.conceptId}
                    className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-800 dark:bg-amber-950/20"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="flex-1 text-sm font-semibold leading-snug">
                          {concept.name}
                        </p>
                        <span className="shrink-0 inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          {concept.primaryMisses}{" "}
                          {concept.primaryMisses !== 1 ? "misses" : "miss"}
                        </span>
                      </div>
                      {concept.summary && (
                        <p className="pl-7 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {concept.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Question breakdown */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Question breakdown
            </h2>

            <div className="space-y-4">
              {results.map((result, index) => (
                <article
                  key={result.id}
                  className={cn(
                    "rounded-xl border bg-background shadow-sm overflow-hidden",
                    result.isCorrect
                      ? "border-emerald-200 dark:border-emerald-800"
                      : "border-red-200 dark:border-red-900",
                  )}
                >
                  {/* Question header strip */}
                  <div
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 text-sm font-medium",
                      result.isCorrect
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        result.isCorrect
                          ? "bg-emerald-600 text-white dark:bg-emerald-500"
                          : "bg-red-600 text-white dark:bg-red-500",
                      )}
                    >
                      {result.isCorrect ? "✓" : "✗"}
                    </span>
                    Q{index + 1}
                    <span className="ml-auto capitalize text-xs font-normal opacity-70">
                      {result.difficulty}
                    </span>
                  </div>

                  {/* Question body */}
                  <div className="space-y-4 p-5">
                    <p className="font-medium leading-snug">{result.prompt}</p>

                    <div className="space-y-2 text-sm">
                      {/* Selected answer */}
                      <div
                        className={cn(
                          "flex flex-col gap-0.5 rounded-lg border px-4 py-3 sm:flex-row sm:items-start sm:gap-2",
                          result.isCorrect
                            ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30"
                            : "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30",
                        )}
                      >
                        <span
                          className={cn(
                            "shrink-0 text-xs font-semibold",
                            result.isCorrect
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400",
                          )}
                        >
                          Your answer:
                        </span>
                        <span className="leading-snug text-foreground">
                          {result.selectedOption ? (
                            <>
                              <span className="font-semibold">
                                {result.selectedOption.optionKey}.
                              </span>{" "}
                              {result.selectedOption.text}
                            </>
                          ) : (
                            <span className="italic text-muted-foreground">
                              No answer recorded
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Correct answer — only shown when wrong */}
                      {!result.isCorrect && result.correctOption && (
                        <div className="flex flex-col gap-0.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30 sm:flex-row sm:items-start sm:gap-2">
                          <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Correct answer:
                          </span>
                          <span className="leading-snug text-foreground">
                            <span className="font-semibold">
                              {result.correctOption.optionKey}.
                            </span>{" "}
                            {result.correctOption.text}
                          </span>
                        </div>
                      )}

                      {/* Explanation */}
                      {result.correctOption?.explanation && (
                        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Explanation:{" "}
                          </span>
                          {result.correctOption.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

        </div>
      </Container>
    </main>
  );
}
