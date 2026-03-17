import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conceptChunkLinks, concepts } from "@/db/schema";

export async function listConceptsByDocumentId(documentId: string) {
  return db
    .select()
    .from(concepts)
    .where(eq(concepts.documentId, documentId))
    .orderBy(asc(concepts.name));
}

export async function deleteConceptsByDocumentId(documentId: string) {
  await db.delete(concepts).where(eq(concepts.documentId, documentId));
}

export async function createConcepts(
  input: Array<{
    documentId: string;
    name: string;
    normalizedName: string;
    summary?: string | null;
  }>,
) {
  if (input.length === 0) {
    return [];
  }

  return db
    .insert(concepts)
    .values(
      input.map((concept) => ({
        documentId: concept.documentId,
        name: concept.name,
        normalizedName: concept.normalizedName,
        summary: concept.summary ?? null,
      })),
    )
    .returning();
}

export async function createConceptChunkLinks(
  input: Array<{
    conceptId: string;
    chunkId: string;
  }>,
) {
  if (input.length === 0) {
    return [];
  }

  return db
    .insert(conceptChunkLinks)
    .values(
      input.map((link) => ({
        conceptId: link.conceptId,
        chunkId: link.chunkId,
      })),
    )
    .returning();
}
