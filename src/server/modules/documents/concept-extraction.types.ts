export type ConceptExtractionChunkInput = {
  id: string;
  sectionTitle: string | null;
  sectionPath: string | null;
  text: string;
};

export type ExtractedConceptItem = {
  name: string;
  normalizedName: string;
  summary: string;
  supportingChunkIds: string[];
};

export type ConceptExtractionResult = {
  concepts: ExtractedConceptItem[];
};

export const conceptExtractionJsonSchema = {
  name: "document_concept_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      concepts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            normalizedName: { type: "string" },
            summary: { type: "string" },
            supportingChunkIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["name", "normalizedName", "summary", "supportingChunkIds"],
        },
      },
    },
    required: ["concepts"],
  },
} as const;
