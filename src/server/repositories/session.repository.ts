import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { userSessions } from "@/db/schema";

export async function createSession(input: {
  userId: string;
  tokenJti: string;
  expiresAt: Date;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const [session] = await db
    .insert(userSessions)
    .values({
      userId: input.userId,
      tokenJti: input.tokenJti,
      expiresAt: input.expiresAt,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    })
    .returning();

  return session;
}

export async function findActiveSessionById(sessionId: string) {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(and(eq(userSessions.id, sessionId), isNull(userSessions.revokedAt)))
    .limit(1);

  return session ?? null;
}

export async function revokeSessionById(sessionId: string) {
  const [session] = await db
    .update(userSessions)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(userSessions.id, sessionId))
    .returning();

  return session ?? null;
}

export async function touchSession(sessionId: string) {
  const [session] = await db
    .update(userSessions)
    .set({
      lastSeenAt: new Date(),
    })
    .where(eq(userSessions.id, sessionId))
    .returning();

  return session ?? null;
}
