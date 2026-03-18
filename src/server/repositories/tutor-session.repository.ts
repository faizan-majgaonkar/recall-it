import { asc, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tutorMessages, tutorSessions } from "@/db/schema";

export async function createTutorSession(input: {
  documentId: string;
  userId: string;
  quizSessionId?: string | null;
  weakConceptIds?: string | null;
}) {
  const [session] = await db
    .insert(tutorSessions)
    .values({
      documentId: input.documentId,
      userId: input.userId,
      quizSessionId: input.quizSessionId ?? null,
      weakConceptIds: input.weakConceptIds ?? null,
    })
    .returning();

  return session;
}

export async function findTutorSessionByIdForUser(input: {
  sessionId: string;
  userId: string;
}) {
  const [session] = await db
    .select()
    .from(tutorSessions)
    .where(
      and(
        eq(tutorSessions.id, input.sessionId),
        eq(tutorSessions.userId, input.userId),
      ),
    )
    .limit(1);

  return session ?? null;
}

export async function createTutorMessage(input: {
  sessionId: string;
  role: string;
  content: string;
  sourceChunkIds?: string | null;
  orderIndex: number;
}) {
  const [message] = await db
    .insert(tutorMessages)
    .values({
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      sourceChunkIds: input.sourceChunkIds ?? null,
      orderIndex: input.orderIndex,
    })
    .returning();

  return message;
}

export async function listMessagesBySessionId(sessionId: string) {
  return db
    .select()
    .from(tutorMessages)
    .where(eq(tutorMessages.sessionId, sessionId))
    .orderBy(asc(tutorMessages.orderIndex));
}

export async function getMessageCount(sessionId: string) {
  const messages = await db
    .select({ orderIndex: tutorMessages.orderIndex })
    .from(tutorMessages)
    .where(eq(tutorMessages.sessionId, sessionId))
    .orderBy(asc(tutorMessages.orderIndex));

  return messages.length;
}
