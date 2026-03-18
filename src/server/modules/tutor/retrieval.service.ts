import { inArray } from "drizzle-orm";
import { openai } from "@/lib/ai/openai";
import { env } from "@/lib/env";
import { queryChunks } from "@/lib/vector/pinecone";
import { db } from "@/db";
import { documentChunks } from "@/db/schema";

export type RetrievedChunk = {
  chunkId: string;
  sectionTitle: string | null;
  text: string;
};

export async function retrieveRelevantChunks(input: {
  query: string;
  documentId: string;
  topK?: number;
}): Promise<RetrievedChunk[]> {
  const topK = input.topK ?? 5;

  const embeddingResponse = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: input.query,
  });

  const queryVector = embeddingResponse.data[0].embedding;

  const matches = await queryChunks({
    vector: queryVector,
    documentId: input.documentId,
    topK,
  });

  if (matches.length === 0) {
    return [];
  }

  const chunkIds = matches.map((m) => m.chunkId);

  const chunkRows = await db
    .select({
      id: documentChunks.id,
      sectionTitle: documentChunks.sectionTitle,
      text: documentChunks.text,
    })
    .from(documentChunks)
    .where(inArray(documentChunks.id, chunkIds));

  const chunkById = new Map(chunkRows.map((c) => [c.id, c]));

  return matches
    .map((m) => {
      const chunk = chunkById.get(m.chunkId);
      if (!chunk) return null;
      return {
        chunkId: chunk.id,
        sectionTitle: chunk.sectionTitle,
        text: chunk.text,
      };
    })
    .filter((c): c is RetrievedChunk => c !== null);
}
