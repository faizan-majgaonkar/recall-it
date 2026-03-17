"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GenerateQuizFormProps = {
  documentId: string;
};

type GenerateQuizResponse = {
  success: boolean;
  message?: string;
  questionBank?: {
    id: string;
    title: string;
    questionCount: number;
  };
};

const selectClass =
  "flex h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function GenerateQuizForm({ documentId }: GenerateQuizFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("Generated Quiz");
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/documents/${documentId}/generate-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            questionCount: Number(questionCount),
            difficulty,
            selectedConceptIds: [],
          }),
        },
      );

      const data: GenerateQuizResponse = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to generate quiz");
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="quiz-title">Quiz title</Label>
        <Input
          id="quiz-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="question-count">Number of questions</Label>
          <select
            id="question-count"
            value={questionCount}
            onChange={(event) => setQuestionCount(event.target.value)}
            disabled={isSubmitting}
            className={selectClass}
          >
            <option value="5">5 questions</option>
            <option value="10">10 questions</option>
            <option value="15">15 questions</option>
            <option value="20">20 questions</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            disabled={isSubmitting}
            className={selectClass}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Generating quiz…" : "Generate quiz"}
      </Button>
    </form>
  );
}
