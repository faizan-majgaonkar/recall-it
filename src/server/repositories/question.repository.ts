import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { questionBanks, options, questions } from "@/db/schema";

export async function createQuestionBank(input: {
  documentId: string;
  userId: string;
  title: string;
  questionCount: number;
  generationStatus?: string;
}) {
  const [questionBank] = await db
    .insert(questionBanks)
    .values({
      documentId: input.documentId,
      userId: input.userId,
      title: input.title,
      questionCount: input.questionCount,
      generationStatus: input.generationStatus ?? "generated",
    })
    .returning();

  return questionBank;
}

export async function createQuestions(
  input: Array<{
    questionBankId: string;
    primaryConceptId: string;
    type: string;
    difficulty: string;
    prompt: string;
    correctExplanation: string;
    sourceChunkIds: string;
    secondaryConceptIds?: string | null;
    orderIndex: number;
  }>,
) {
  if (input.length === 0) {
    return [];
  }

  return db
    .insert(questions)
    .values(
      input.map((question) => ({
        questionBankId: question.questionBankId,
        primaryConceptId: question.primaryConceptId,
        type: question.type,
        difficulty: question.difficulty,
        prompt: question.prompt,
        correctExplanation: question.correctExplanation,
        sourceChunkIds: question.sourceChunkIds,
        secondaryConceptIds: question.secondaryConceptIds ?? null,
        orderIndex: question.orderIndex,
      })),
    )
    .returning();
}

export async function createQuestionOptions(
  input: Array<{
    questionId: string;
    optionKey: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
    distractorRationale?: string | null;
    orderIndex: number;
  }>,
) {
  if (input.length === 0) {
    return [];
  }

  return db
    .insert(options)
    .values(
      input.map((option) => ({
        questionId: option.questionId,
        optionKey: option.optionKey,
        text: option.text,
        isCorrect: option.isCorrect,
        explanation: option.explanation,
        distractorRationale: option.distractorRationale ?? null,
        orderIndex: option.orderIndex,
      })),
    )
    .returning();
}

export async function listQuestionBanksByDocumentId(documentId: string) {
  return db
    .select()
    .from(questionBanks)
    .where(eq(questionBanks.documentId, documentId))
    .orderBy(asc(questionBanks.createdAt));
}
