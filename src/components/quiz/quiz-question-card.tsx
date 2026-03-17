type QuizQuestionCardProps = {
  questionNumber: number;
  question: {
    id: string;
    prompt: string;
    difficulty: string;
    options: Array<{
      id: string;
      optionKey: string;
      text: string;
    }>;
  };
};

export function QuizQuestionCard({
  questionNumber,
  question,
}: QuizQuestionCardProps) {
  return (
    <article className="rounded-xl border bg-background p-5 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Question {questionNumber}
            </span>

            <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
              {question.difficulty}
            </span>
          </div>

          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            {question.prompt}
          </h2>
        </div>

        <div className="space-y-3">
          {question.options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                className="mt-1"
              />
              <div className="space-y-1">
                <p className="text-sm sm:text-base">{option.text}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </article>
  );
}
