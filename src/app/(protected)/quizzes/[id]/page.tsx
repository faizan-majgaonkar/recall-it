import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
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
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {questionBank.title}
            </h1>
            <p className="text-muted-foreground">
              {questions.length} questions
            </p>
          </section>

          {questions.length > 0 ? (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <QuizQuestionCard
                  key={question.id}
                  questionNumber={index + 1}
                  question={{
                    id: question.id,
                    prompt: question.prompt,
                    difficulty: question.difficulty,
                    options: question.options.map((option) => ({
                      id: option.id,
                      optionKey: option.optionKey,
                      text: option.text,
                    })),
                  }}
                />
              ))}
            </div>
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
