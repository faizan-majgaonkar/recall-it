import { z } from "zod";
import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import { findDocumentByIdForUser } from "@/server/repositories/document.repository";
import {
  startTutorSession,
  sendTutorMessage,
} from "@/server/modules/tutor/tutor.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const startSessionSchema = z.object({
  action: z.literal("start"),
  quizSessionId: z.string().uuid().optional(),
  weakConceptIds: z.array(z.string().uuid()).optional(),
});

const sendMessageSchema = z.object({
  action: z.literal("message"),
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

const requestSchema = z.discriminatedUnion("action", [
  startSessionSchema,
  sendMessageSchema,
]);

export async function POST(request: Request, context: RouteContext) {
  const user = await requireAuthenticatedUserForApi();
  const { id } = await context.params;

  const document = await findDocumentByIdForUser({
    documentId: id,
    userId: user.id,
  });

  if (!document) {
    return Response.json(
      { success: false, message: "Document not found" },
      { status: 404 },
    );
  }

  if (document.processingStatus !== "embedded") {
    return Response.json(
      {
        success: false,
        message: "Document must be embedded before using the tutor",
      },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "start") {
      const result = await startTutorSession({
        documentId: document.id,
        userId: user.id,
        quizSessionId: parsed.data.quizSessionId,
        weakConceptIds: parsed.data.weakConceptIds,
      });

      return Response.json({
        success: true,
        sessionId: result.sessionId,
        reply: result.greeting,
        sourceChunks: result.sourceChunks.map((c) => ({
          chunkId: c.chunkId,
          sectionTitle: c.sectionTitle,
        })),
      });
    }

    const result = await sendTutorMessage({
      sessionId: parsed.data.sessionId,
      userId: user.id,
      message: parsed.data.message,
      documentId: document.id,
    });

    return Response.json({
      success: true,
      reply: result.reply,
      sourceChunks: result.sourceChunks.map((c) => ({
        chunkId: c.chunkId,
        sectionTitle: c.sectionTitle,
      })),
    });
  } catch (error) {
    console.error("Tutor API error", error);

    return Response.json(
      { success: false, message: "Something went wrong with the tutor" },
      { status: 500 },
    );
  }
}
