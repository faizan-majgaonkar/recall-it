import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import { findDocumentByIdForUser } from "@/server/repositories/document.repository";
import { embedDocumentChunks } from "@/server/modules/documents/embedding.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

  try {
    await embedDocumentChunks(document.id);

    return Response.json({
      success: true,
      message: "Document chunks embedded successfully",
      documentId: document.id,
    });
  } catch (error) {
    console.error("Embedding failed for document", document.id, error);

    return Response.json(
      { success: false, message: "Failed to embed document chunks" },
      { status: 500 },
    );
  }
}
