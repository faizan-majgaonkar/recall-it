import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import {
  findDocumentByIdForUser,
  saveDocumentExtractionMetadata,
  updateDocumentProcessingStatus,
} from "@/server/repositories/document.repository";
import { extractDocumentTextFromR2 } from "@/server/modules/documents/text-extraction.service";

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
      {
        success: false,
        message: "Document not found",
      },
      { status: 404 },
    );
  }

  try {
    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "extracting_text",
      processingError: null,
    });

    const extracted = await extractDocumentTextFromR2({
      bucket: document.storageBucket,
      key: document.storageKey,
      mimeType: document.mimeType,
    });

    const updatedDocument = await saveDocumentExtractionMetadata({
      documentId: document.id,
      extractedPageCount: extracted.pageCount,
    });

    return Response.json({
      success: true,
      message: "Text extracted successfully",
      document: updatedDocument,
      extraction: {
        detectedType: extracted.detectedType,
        pageCount: extracted.pageCount,
        textLength: extracted.text.length,
        preview: extracted.text.slice(0, 1000),
      },
    });
  } catch (error) {
    console.error("Document text extraction failed", error);

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "extraction_failed",
      processingError:
        error instanceof Error ? error.message : "Unknown extraction error",
    });

    return Response.json(
      {
        success: false,
        message: "Failed to extract document text",
      },
      { status: 500 },
    );
  }
}
