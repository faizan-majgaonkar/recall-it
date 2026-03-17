import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documentChunks } from "@/db/schema";

export async function listChunksByDocumentId(documentId: string) {
  return db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.documentId, documentId))
    .orderBy(asc(documentChunks.chunkIndex));
}

export async function deleteChunksByDocumentId(documentId: string) {
  await db
    .delete(documentChunks)
    .where(eq(documentChunks.documentId, documentId));
}

export async function createChunks(
  input: Array<{
    documentId: string;
    chunkIndex: number;
    sectionTitle?: string | null;
    sectionPath?: string | null;
    headingLevel?: number | null;
    pageStart?: number | null;
    pageEnd?: number | null;
    text: string;
    tokenCount?: number | null;
    isFullSection: boolean;
    overlapFromPrevious?: number | null;
  }>,
) {
  if (input.length === 0) {
    return [];
  }

  return db
    .insert(documentChunks)
    .values(
      input.map((chunk) => ({
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        sectionTitle: chunk.sectionTitle ?? null,
        sectionPath: chunk.sectionPath ?? null,
        headingLevel: chunk.headingLevel ?? null,
        pageStart: chunk.pageStart ?? null,
        pageEnd: chunk.pageEnd ?? null,
        text: chunk.text,
        tokenCount: chunk.tokenCount ?? null,
        isFullSection: chunk.isFullSection,
        overlapFromPrevious: chunk.overlapFromPrevious ?? null,
      })),
    )
    .returning();
}
