import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { conceptChunkLinks, concepts, documentChunks, questions } from "@/db/schema";

export async function listConceptsByQuestionBankId(questionBankId: string) {
  const questionRows = await db
    .select({ primaryConceptId: questions.primaryConceptId })
    .from(questions)
    .where(eq(questions.questionBankId, questionBankId));

  const conceptIds = Array.from(
    new Set(questionRows.map((q) => q.primaryConceptId)),
  );

  if (conceptIds.length === 0) {
    return [];
  }

  return db
    .select({ id: concepts.id, name: concepts.name })
    .from(concepts)
    .where(inArray(concepts.id, conceptIds))
    .orderBy(asc(concepts.name));
}

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

export async function listConceptsWithSupportingChunksByDocumentId(input: {
  documentId: string;
  selectedConceptIds?: string[];
}) {
  const conceptRows =
    input.selectedConceptIds && input.selectedConceptIds.length > 0
      ? await db
          .select()
          .from(concepts)
          .where(inArray(concepts.id, input.selectedConceptIds))
          .orderBy(asc(concepts.name))
      : await listConceptsByDocumentId(input.documentId);

  if (conceptRows.length === 0) {
    return [];
  }

  const conceptIds = conceptRows.map((concept) => concept.id);

  const linkRows = await db
    .select()
    .from(conceptChunkLinks)
    .where(inArray(conceptChunkLinks.conceptId, conceptIds));

  const chunkIds = Array.from(new Set(linkRows.map((link) => link.chunkId)));

  const chunkRows =
    chunkIds.length > 0
      ? await db
          .select()
          .from(documentChunks)
          .where(inArray(documentChunks.id, chunkIds))
      : [];

  const chunkById = new Map(chunkRows.map((chunk) => [chunk.id, chunk]));

  return conceptRows.map((concept) => {
    const supportingChunks = linkRows
      .filter((link) => link.conceptId === concept.id)
      .map((link) => chunkById.get(link.chunkId))
      .filter((chunk): chunk is NonNullable<typeof chunk> => Boolean(chunk))
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((chunk) => ({
        id: chunk.id,
        sectionTitle: chunk.sectionTitle,
        sectionPath: chunk.sectionPath,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
      }));

    return {
      id: concept.id,
      name: concept.name,
      normalizedName: concept.normalizedName,
      summary: concept.summary,
      supportingChunks,
      importanceScore: supportingChunks.length,
    };
  });
}
