import Link from "next/link";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  score: number | null;
  correctCount: number | null;
  totalQuestions: number;
  createdAt: Date;
};

type SessionHistoryListProps = {
  sessions: Session[];
};

function scoreBadgeClass(score: number) {
  if (score >= 80)
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (score >= 50)
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
  return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function SessionHistoryList({ sessions }: SessionHistoryListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        No attempts yet. Complete the quiz above to see your history here.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border bg-background shadow-sm">
      {sessions.map((session, index) => {
        const score = session.score ?? 0;
        return (
          <div
            key={session.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
          >
            <span className="w-5 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
              #{index + 1}
            </span>

            <span className="min-w-0 flex-1 text-sm text-muted-foreground">
              {formatDate(session.createdAt)}
            </span>

            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                scoreBadgeClass(score),
              )}
            >
              {score}% &nbsp;·&nbsp; {session.correctCount ?? 0}/
              {session.totalQuestions}
            </span>

            <Link
              href={`/quizzes/sessions/${session.id}`}
              className="shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              View results →
            </Link>
          </div>
        );
      })}
    </div>
  );
}
