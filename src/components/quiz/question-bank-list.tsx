type QuestionBankListProps = {
  questionBanks: Array<{
    id: string;
    title: string;
    questionCount: number;
    generationStatus: string;
    createdAt: Date;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function QuestionBankList({ questionBanks }: QuestionBankListProps) {
  if (questionBanks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        No quiz banks have been generated for this document yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questionBanks.map((questionBank) => (
        <article
          key={questionBank.id}
          className="rounded-xl border bg-background p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold tracking-tight">
                {questionBank.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {questionBank.questionCount} questions
              </p>
              <p className="text-xs text-muted-foreground">
                Created: {formatDate(questionBank.createdAt)}
              </p>
            </div>

            <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
              {questionBank.generationStatus}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
