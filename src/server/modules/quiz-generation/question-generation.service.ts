import { env } from "@/lib/env";
import { openai } from "@/lib/ai/openai";
import type {
  GeneratedQuestionBatchOutput,
  GeneratedQuestionOutput,
  QuizDifficulty,
  QuizGenerationConceptInput,
} from "./question-generation.types";
import { questionGenerationJsonSchema } from "./question-generation.types";

const DEFAULT_DIFFICULTY: QuizDifficulty = "medium";
const MAX_CONCEPTS_PER_BATCH = 3;
const MAX_CHUNKS_PER_CONCEPT = 3;

function chunkIntoBatches<T>(items: T[], size: number) {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

function clampQuestionCount(value: number) {
  return Math.max(5, Math.min(20, value));
}

function allocateQuestionsAcrossConcepts(
  concepts: QuizGenerationConceptInput[],
  questionCount: number,
) {
  const safeQuestionCount = clampQuestionCount(questionCount);

  const sorted = [...concepts].sort(
    (a, b) => b.importanceScore - a.importanceScore,
  );

  if (sorted.length === 0) {
    return [];
  }

  const allocations = new Map<string, number>();

  if (safeQuestionCount <= sorted.length) {
    for (const concept of sorted.slice(0, safeQuestionCount)) {
      allocations.set(concept.id, 1);
    }

    return sorted
      .filter((concept) => allocations.has(concept.id))
      .map((concept) => ({
        concept,
        questionCount: allocations.get(concept.id) ?? 0,
      }));
  }

  for (const concept of sorted) {
    allocations.set(concept.id, 1);
  }

  let remaining = safeQuestionCount - sorted.length;
  let pointer = 0;

  while (remaining > 0) {
    const concept = sorted[pointer % sorted.length];
    allocations.set(concept.id, (allocations.get(concept.id) ?? 0) + 1);
    remaining -= 1;
    pointer += 1;
  }

  return sorted.map((concept) => ({
    concept,
    questionCount: allocations.get(concept.id) ?? 0,
  }));
}

function buildQuestionGenerationPrompt(input: {
  difficulty: QuizDifficulty;
  allocations: Array<{
    concept: QuizGenerationConceptInput;
    questionCount: number;
  }>;
}) {
  const conceptBlocks = input.allocations
    .map(({ concept, questionCount }) => {
      const supportingChunks = concept.supportingChunks
        .slice(0, MAX_CHUNKS_PER_CONCEPT)
        .map((chunk) =>
          [
            `Chunk ID: ${chunk.id}`,
            chunk.sectionTitle ? `Section Title: ${chunk.sectionTitle}` : null,
            chunk.sectionPath ? `Section Path: ${chunk.sectionPath}` : null,
            "Chunk Text:",
            chunk.text,
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n---\n\n");

      return [
        `Concept ID: ${concept.id}`,
        `Concept Name: ${concept.name}`,
        `Normalized Name: ${concept.normalizedName}`,
        concept.summary ? `Concept Summary: ${concept.summary}` : null,
        `Questions Needed: ${questionCount}`,
        "Supporting Chunks:",
        supportingChunks,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n====================\n\n");

  return [
    "Generate grounded multiple-choice quiz questions from the provided concepts and supporting chunks.",
    "Requirements:",
    "- Generate exactly the requested number of questions for each concept block.",
    "- Each question must have exactly one primaryConceptId.",
    "- Each question may have 0 to 2 secondaryConceptIds.",
    "- Use only sourceChunkIds that appear in the provided concept blocks.",
    "- Generate exactly 4 answer options per question.",
    "- Exactly one option must be correct.",
    "- Every option must include explanation and distractorRationale.",
    "- explanation should say why the option is right or wrong. Without any begining phrase like Correct or This is Incorrect etc.",
    "- distractorRationale should describe the misconception being tested; use null for the correct option if appropriate.",
    "- Keep questions grounded in the document content only.",
    `- Difficulty level: ${input.difficulty}.`,
    "",
    conceptBlocks,
  ].join("\n");
}

async function generateQuestionBatch(input: {
  allocations: Array<{
    concept: QuizGenerationConceptInput;
    questionCount: number;
  }>;
  difficulty: QuizDifficulty;
}) {
  const response = await openai.responses.create({
    model: env.OPENAI_QUESTION_MODEL,
    input: [
      {
        role: "developer",
        content:
          "You are a grounded quiz generation system. Return only structured JSON matching the required schema.",
      },
      {
        role: "user",
        content: buildQuestionGenerationPrompt({
          difficulty: input.difficulty,
          allocations: input.allocations,
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        ...questionGenerationJsonSchema,
      },
    },
  });

  const parsed = JSON.parse(
    response.output_text,
  ) as GeneratedQuestionBatchOutput;
  return parsed.questions ?? [];
}

function validateGeneratedQuestion(question: GeneratedQuestionOutput) {
  if (question.type !== "single_select_mcq") {
    return false;
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return false;
  }

  const correctCount = question.options.filter(
    (option) => option.isCorrect,
  ).length;
  if (correctCount !== 1) {
    return false;
  }

  return true;
}

export async function generateQuestionsFromConcepts(input: {
  concepts: QuizGenerationConceptInput[];
  questionCount: number;
  difficulty?: QuizDifficulty;
}) {
  const difficulty = input.difficulty ?? DEFAULT_DIFFICULTY;

  const allocations = allocateQuestionsAcrossConcepts(
    input.concepts,
    input.questionCount,
  ).filter((item) => item.questionCount > 0);

  const batches = chunkIntoBatches(allocations, MAX_CONCEPTS_PER_BATCH);
  const generatedQuestions: GeneratedQuestionOutput[] = [];

  for (const batch of batches) {
    const batchQuestions = await generateQuestionBatch({
      allocations: batch,
      difficulty,
    });

    for (const question of batchQuestions) {
      if (!validateGeneratedQuestion(question)) {
        continue;
      }

      generatedQuestions.push(question);
    }
  }

  return generatedQuestions.slice(0, clampQuestionCount(input.questionCount));
}
