import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { options, quizAnswers, quizSessions } from "@/db/schema";

export async function createQuizSession(input: {
  questionBankId: string;
  userId: string;
  totalQuestions: number;
}) {
  const [session] = await db
    .insert(quizSessions)
    .values({
      questionBankId: input.questionBankId,
      userId: input.userId,
      totalQuestions: input.totalQuestions,
      status: "in_progress",
    })
    .returning();

  return session;
}

export async function completeQuizSession(input: {
  sessionId: string;
  correctCount: number;
  score: number;
}) {
  const [session] = await db
    .update(quizSessions)
    .set({
      status: "completed",
      correctCount: input.correctCount,
      score: input.score,
      completedAt: new Date(),
    })
    .where(eq(quizSessions.id, input.sessionId))
    .returning();

  return session;
}

export async function createQuizAnswers(
  input: Array<{
    sessionId: string;
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }>,
) {
  if (input.length === 0) {
    return [];
  }

  return db.insert(quizAnswers).values(input).returning();
}

export async function listSessionsByQuestionBankId(questionBankId: string) {
  return db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.questionBankId, questionBankId))
    .orderBy(desc(quizSessions.createdAt));
}

export async function findSessionByIdForUser(input: {
  sessionId: string;
  userId: string;
}) {
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.id, input.sessionId))
    .limit(1);

  if (!session || session.userId !== input.userId) {
    return null;
  }

  return session;
}

export async function listAnswersBySessionId(sessionId: string) {
  return db
    .select()
    .from(quizAnswers)
    .where(eq(quizAnswers.sessionId, sessionId));
}

export async function getOptionsByIds(optionIds: string[]) {
  if (optionIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: options.id,
      questionId: options.questionId,
      isCorrect: options.isCorrect,
    })
    .from(options)
    .where(inArray(options.id, optionIds));
}
