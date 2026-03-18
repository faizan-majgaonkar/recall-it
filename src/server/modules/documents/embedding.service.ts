import { openai } from "@/lib/ai/openai";
import { env } from "@/lib/env";
import { upsertChunkEmbeddings } from "@/lib/vector/pinecone";
import { listChunksByDocumentId } from "@/server/repositories/chunk.repository";
import { updateDocumentProcessingStatus } from "@/server/repositories/document.repository";

const EMBED_BATCH_SIZE = 512;

export async function embedDocumentChunks(documentId: string): Promise<void> {
  await updateDocumentProcessingStatus({
    documentId,
    processingStatus: "embedding",
    processingError: null,
  });

  try {
    const chunks = await listChunksByDocumentId(documentId);

    if (chunks.length === 0) {
      await updateDocumentProcessingStatus({
        documentId,
        processingStatus: "embedded",
        processingError: null,
      });
      return;
    }

    const allVectors: Array<{
      chunkId: string;
      documentId: string;
      sectionTitle: string | null;
      values: number[];
    }> = [];

    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);

      const response = await openai.embeddings.create({
        model: env.OPENAI_EMBEDDING_MODEL,
        input: batch.map((chunk) => chunk.text),
      });

      for (let j = 0; j < batch.length; j++) {
        allVectors.push({
          chunkId: batch[j].id,
          documentId,
          sectionTitle: batch[j].sectionTitle,
          values: response.data[j].embedding,
        });
      }
    }

    if (allVectors.length > 0) {
      await upsertChunkEmbeddings(allVectors);
    }

    await updateDocumentProcessingStatus({
      documentId,
      processingStatus: "embedded",
      processingError: null,
    });
  } catch (error) {
    await updateDocumentProcessingStatus({
      documentId,
      processingStatus: "embedding_failed",
      processingError:
        error instanceof Error ? error.message : "Unknown embedding error",
    });
    throw error;
  }
}
