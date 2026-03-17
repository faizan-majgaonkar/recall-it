"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Option = {
  id: string;
  optionKey: string;
  text: string;
};

type Question = {
  id: string;
  prompt: string;
  difficulty: string;
  options: Option[];
};

type QuizRunnerProps = {
  questionBankId: string;
  questions: Question[];
};

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  hard: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
};

export function QuizRunner({ questionBankId, questions }: QuizRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;
  const unansweredCount = totalQuestions - answeredCount;

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit() {
    if (!allAnswered || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/quizzes/${questionBankId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(
            ([questionId, selectedOptionId]) => ({
              questionId,
              selectedOptionId,
            }),
          ),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message ?? "Submission failed. Please try again.");
        return;
      }

      router.push(`/quizzes/sessions/${data.sessionId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedOptionId = answers[currentQuestion.id];
  const difficultyClass =
    DIFFICULTY_STYLES[currentQuestion.difficulty] ??
    "border-border bg-muted/40 text-muted-foreground";

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Question {currentIndex + 1}{" "}
            <span className="text-muted-foreground">of {totalQuestions}</span>
          </span>
          <span className="text-muted-foreground">
            {answeredCount} / {totalQuestions} answered
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{
              width: `${Math.round((answeredCount / totalQuestions) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <article className="rounded-xl border bg-background shadow-sm">
        {/* Card header */}
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
              difficultyClass,
            )}
          >
            {currentQuestion.difficulty}
          </span>
        </div>

        {/* Prompt */}
        <div className="px-6 py-5">
          <p className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
            {currentQuestion.prompt}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5 px-6 pb-6">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(currentQuestion.id, option.id)}
                className={cn(
                  "group flex w-full items-start gap-3.5 rounded-lg border p-4 text-left transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30 hover:bg-accent/30",
                )}
              >
                {/* Radio indicator */}
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40 group-hover:border-muted-foreground/60",
                  )}
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  )}
                </span>

                {/* Option text */}
                <span className="flex-1 text-sm leading-snug sm:text-base">
                  <span
                    className={cn(
                      "mr-1.5 font-semibold",
                      isSelected ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {option.optionKey}.
                  </span>
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </article>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Unanswered warning shown only on last question */}
      {isLast && !allAnswered && (
        <p className="text-sm text-muted-foreground">
          {unansweredCount} question{unansweredCount !== 1 ? "s" : ""} still
          unanswered. Answer all questions before submitting.
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={isFirst}
        >
          ← Previous
        </Button>

        {isLast ? (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit quiz →"}
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next →</Button>
        )}
      </div>
    </div>
  );
}
