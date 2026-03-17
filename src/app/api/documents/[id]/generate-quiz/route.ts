import { ZodError } from "zod";
import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import { findDocumentByIdForUser } from "@/server/repositories/document.repository";
import { generateAndPersistQuizForDocument } from "@/server/modules/quiz-generation/quiz-generation.persistence.service";
import { generateQuizSchema } from "@/server/modules/quiz-generation/quiz-generation.validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireAuthenticatedUserForApi();
  const { id } = await context.params;

  const document = await findDocumentByIdForUser({
    documentId: id,
    userId: user.id,
  });

  if (!document) {
    return Response.json(
      {
        success: false,
        message: "Document not found",
      },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();

    const parsed = generateQuizSchema.parse({
      title: body.title,
      questionCount: body.questionCount,
      difficulty: body.difficulty,
      selectedConceptIds: body.selectedConceptIds,
    });

    const result = await generateAndPersistQuizForDocument({
      documentId: document.id,
      userId: user.id,
      title: parsed.title,
      questionCount: parsed.questionCount,
      difficulty: parsed.difficulty,
      selectedConceptIds: parsed.selectedConceptIds,
    });

    return Response.json({
      success: true,
      message: "Quiz generated successfully",
      questionBank: {
        id: result.questionBank.id,
        title: result.questionBank.title,
        questionCount: result.questions.length,
      },
      preview: result.questions.slice(0, 3).map((question) => ({
        id: question.id,
        prompt: question.prompt,
        difficulty: question.difficulty,
      })),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          success: false,
          message: "Invalid quiz generation request",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("Quiz generation failed", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to generate quiz",
      },
      { status: 500 },
    );
  }
}
