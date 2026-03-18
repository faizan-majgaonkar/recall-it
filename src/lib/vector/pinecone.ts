import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "@/lib/env";

let _client: Pinecone | null = null;

function getPineconeClient() {
  if (!_client) {
    _client = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  }
  return _client;
}

function getIndex() {
  return getPineconeClient().index(env.PINECONE_INDEX);
}

export type ChunkVector = {
  chunkId: string;
  documentId: string;
  sectionTitle: string | null;
  values: number[];
};

export async function upsertChunkEmbeddings(vectors: ChunkVector[]) {
  if (vectors.length === 0) return;

  const index = getIndex();

  const records = vectors.map((v) => ({
    id: v.chunkId,
    values: v.values,
    metadata: {
      documentId: v.documentId,
      sectionTitle: v.sectionTitle ?? "",
    },
  }));

  // Pinecone recommends batches of ≤100
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    if (batch.length === 0) continue;
    await index.upsert({ records: batch });
  }
}

export async function queryChunks(input: {
  vector: number[];
  documentId: string;
  topK: number;
}): Promise<Array<{ chunkId: string; score: number }>> {
  const index = getIndex();

  const result = await index.query({
    vector: input.vector,
    topK: input.topK,
    filter: { documentId: { $eq: input.documentId } },
    includeMetadata: false,
  });

  return (result.matches ?? []).map((match) => ({
    chunkId: match.id,
    score: match.score ?? 0,
  }));
}
