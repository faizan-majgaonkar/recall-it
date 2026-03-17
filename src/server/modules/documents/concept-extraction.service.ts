import { env } from "@/lib/env";
import { openai } from "@/lib/ai/openai";
import type {
  ConceptExtractionChunkInput,
  ConceptExtractionResult,
  ExtractedConceptItem,
} from "./concept-extraction.types";
import { conceptExtractionJsonSchema } from "./concept-extraction.types";

const MAX_CHUNKS_PER_BATCH = 8;

function normalizeConceptName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "");
}

function chunkIntoBatches<T>(items: T[], size: number) {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

function buildConceptExtractionPrompt(chunks: ConceptExtractionChunkInput[]) {
  const serializedChunks = chunks
    .map((chunk) => {
      return [
        `Chunk ID: ${chunk.id}`,
        chunk.sectionTitle ? `Section Title: ${chunk.sectionTitle}` : null,
        chunk.sectionPath ? `Section Path: ${chunk.sectionPath}` : null,
        `Chunk Text:`,
        chunk.text,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");

  return [
    "Extract the main learning concepts from the provided document chunks.",
    "Return concepts that are important, teachable, and likely useful for quiz generation.",
    "Each concept must include:",
    "- a clear human-readable name",
    "- a normalized_name in lowercase",
    "- a short summary",
    "- supportingChunkIds containing only chunk IDs from the input",
    "Do not invent chunk IDs.",
    "Do not include vague meta concepts like 'introduction' unless they are actual teachable concepts.",
    "",
    serializedChunks,
  ].join("\n");
}

async function extractConceptsFromBatch(
  chunks: ConceptExtractionChunkInput[],
): Promise<ExtractedConceptItem[]> {
  const response = await openai.responses.create({
    model: env.OPENAI_CONCEPT_MODEL,
    input: [
      {
        role: "developer",
        content:
          "You are a document concept extraction system. Return only structured JSON matching the required schema.",
      },
      {
        role: "user",
        content: buildConceptExtractionPrompt(chunks),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        ...conceptExtractionJsonSchema,
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as ConceptExtractionResult;
  return parsed.concepts ?? [];
}

export async function extractConceptsFromChunks(
  chunks: ConceptExtractionChunkInput[],
) {
  const batches = chunkIntoBatches(chunks, MAX_CHUNKS_PER_BATCH);

  const mergedConcepts = new Map<
    string,
    {
      name: string;
      normalizedName: string;
      summary: string;
      supportingChunkIds: Set<string>;
    }
  >();

  for (const batch of batches) {
    const extracted = await extractConceptsFromBatch(batch);

    for (const concept of extracted) {
      const normalizedName =
        normalizeConceptName(concept.normalizedName || concept.name) ||
        normalizeConceptName(concept.name);

      if (!normalizedName) {
        continue;
      }

      const existing = mergedConcepts.get(normalizedName);

      if (!existing) {
        mergedConcepts.set(normalizedName, {
          name: concept.name.trim(),
          normalizedName,
          summary: concept.summary.trim(),
          supportingChunkIds: new Set(concept.supportingChunkIds),
        });

        continue;
      }

      for (const chunkId of concept.supportingChunkIds) {
        existing.supportingChunkIds.add(chunkId);
      }

      if (!existing.summary && concept.summary.trim()) {
        existing.summary = concept.summary.trim();
      }
    }
  }

  return Array.from(mergedConcepts.values()).map((concept) => ({
    name: concept.name,
    normalizedName: concept.normalizedName,
    summary: concept.summary,
    supportingChunkIds: Array.from(concept.supportingChunkIds),
  }));
}
