import { listConceptsWithSupportingChunksByDocumentId } from "@/server/repositories/concept.repository";
import {
  createQuestionBank,
  createQuestions,
  createQuestionOptions,
} from "@/server/repositories/question.repository";
import { generateQuestionsFromConcepts } from "./question-generation.service";
import type { GenerateQuizInput } from "./quiz-generation.validators";

export async function generateAndPersistQuizForDocument(input: {
  documentId: string;
  userId: string;
  title: string;
  questionCount: number;
  difficulty: GenerateQuizInput["difficulty"];
  selectedConceptIds: string[];
}) {
  const concepts = await listConceptsWithSupportingChunksByDocumentId({
    documentId: input.documentId,
    selectedConceptIds:
      input.selectedConceptIds.length > 0
        ? input.selectedConceptIds
        : undefined,
  });

  if (concepts.length === 0) {
    throw new Error("No concepts available for quiz generation");
  }

  const generatedQuestions = await generateQuestionsFromConcepts({
    concepts,
    questionCount: input.questionCount,
    difficulty: input.difficulty,
  });

  if (generatedQuestions.length === 0) {
    throw new Error("Quiz generation did not produce any valid questions");
  }

  const questionBank = await createQuestionBank({
    documentId: input.documentId,
    userId: input.userId,
    title: input.title,
    questionCount: generatedQuestions.length,
    generationStatus: "generated",
  });

  const savedQuestions = await createQuestions(
    generatedQuestions.map((question, index) => ({
      questionBankId: questionBank.id,
      primaryConceptId: question.primaryConceptId,
      type: question.type,
      difficulty: question.difficulty,
      prompt: question.prompt,
      correctExplanation: question.correctExplanation,
      sourceChunkIds: JSON.stringify(question.sourceChunkIds),
      secondaryConceptIds: JSON.stringify(question.secondaryConceptIds),
      orderIndex: index,
    })),
  );

  const optionsToCreate = savedQuestions.flatMap(
    (savedQuestion, questionIndex) => {
      const generatedQuestion = generatedQuestions[questionIndex];

      return generatedQuestion.options.map((option, optionIndex) => ({
        questionId: savedQuestion.id,
        optionKey: option.optionKey,
        text: option.text,
        isCorrect: option.isCorrect,
        explanation: option.explanation,
        distractorRationale: option.distractorRationale,
        orderIndex: optionIndex,
      }));
    },
  );

  const savedOptions = await createQuestionOptions(optionsToCreate);

  return {
    questionBank,
    questions: savedQuestions,
    options: savedOptions,
  };
}
