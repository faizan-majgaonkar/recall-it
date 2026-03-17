export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestionType = "single_select_mcq";

export type QuizGenerationConceptInput = {
  id: string;
  name: string;
  normalizedName: string;
  summary: string | null;
  importanceScore: number;
  supportingChunks: Array<{
    id: string;
    sectionTitle: string | null;
    sectionPath: string | null;
    text: string;
    tokenCount: number | null;
  }>;
};

export type QuizGenerationRequest = {
  documentId: string;
  questionCount: number;
  selectedConceptIds?: string[];
  difficulty?: QuizDifficulty;
};

export type QuestionOptionOutput = {
  optionKey: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  distractorRationale: string | null;
};

export type GeneratedQuestionOutput = {
  primaryConceptId: string;
  secondaryConceptIds: string[];
  type: QuizQuestionType;
  difficulty: QuizDifficulty;
  prompt: string;
  correctExplanation: string;
  sourceChunkIds: string[];
  options: QuestionOptionOutput[];
};

export type GeneratedQuestionBatchOutput = {
  questions: GeneratedQuestionOutput[];
};

export const questionGenerationJsonSchema = {
  name: "generated_quiz_questions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            primaryConceptId: { type: "string" },
            secondaryConceptIds: {
              type: "array",
              items: { type: "string" },
            },
            type: {
              type: "string",
              enum: ["single_select_mcq"],
            },
            difficulty: {
              type: "string",
              enum: ["easy", "medium", "hard"],
            },
            prompt: { type: "string" },
            correctExplanation: { type: "string" },
            sourceChunkIds: {
              type: "array",
              items: { type: "string" },
            },
            options: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  optionKey: { type: "string" },
                  text: { type: "string" },
                  isCorrect: { type: "boolean" },
                  explanation: { type: "string" },
                  distractorRationale: {
                    anyOf: [{ type: "string" }, { type: "null" }],
                  },
                },
                required: [
                  "optionKey",
                  "text",
                  "isCorrect",
                  "explanation",
                  "distractorRationale",
                ],
              },
            },
          },
          required: [
            "primaryConceptId",
            "secondaryConceptIds",
            "type",
            "difficulty",
            "prompt",
            "correctExplanation",
            "sourceChunkIds",
            "options",
          ],
        },
      },
    },
    required: ["questions"],
  },
} as const;
