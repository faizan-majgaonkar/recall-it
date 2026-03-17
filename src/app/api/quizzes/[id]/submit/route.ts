import { ZodError } from "zod";
import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import { findQuestionBankByIdForUser } from "@/server/repositories/question.repository";
import {
  createQuizAnswers,
  createQuizSession,
  completeQuizSession,
  getOptionsByIds,
} from "@/server/repositories/quiz-session.repository";
import { submitQuizSchema } from "@/server/modules/quiz-evaluation/quiz-evaluation.validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireAuthenticatedUserForApi();
  const { id } = await context.params;

  const questionBank = await findQuestionBankByIdForUser({
    questionBankId: id,
    userId: user.id,
  });

  if (!questionBank) {
    return Response.json(
      { success: false, message: "Quiz not found" },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();
    const { answers } = submitQuizSchema.parse(body);

    // Verify all submitted selectedOptionIds exist and belong to this question bank
    const selectedOptionIds = answers.map((a) => a.selectedOptionId);
    const optionRows = await getOptionsByIds(selectedOptionIds);

    if (optionRows.length !== answers.length) {
      return Response.json(
        {
          success: false,
          message: "One or more selected options are invalid",
        },
        { status: 400 },
      );
    }

    // Build a fast lookup: optionId → isCorrect
    const optionCorrectnessById = new Map(
      optionRows.map((opt) => [opt.id, opt.isCorrect]),
    );

    // Deterministically compute correctness for each answer
    const scoredAnswers = answers.map((answer) => ({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      isCorrect: optionCorrectnessById.get(answer.selectedOptionId) ?? false,
    }));

    const correctCount = scoredAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = answers.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Persist session
    const session = await createQuizSession({
      questionBankId: questionBank.id,
      userId: user.id,
      totalQuestions,
    });

    // Persist answers
    await createQuizAnswers(
      scoredAnswers.map((answer) => ({
        sessionId: session.id,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        isCorrect: answer.isCorrect,
      })),
    );

    // Mark session complete
    const completedSession = await completeQuizSession({
      sessionId: session.id,
      correctCount,
      score,
    });

    return Response.json({
      success: true,
      sessionId: completedSession.id,
      totalQuestions,
      correctCount,
      score,
      answers: scoredAnswers,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          success: false,
          message: "Invalid submission",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("Quiz submission failed", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to submit quiz",
      },
      { status: 500 },
    );
  }
}
