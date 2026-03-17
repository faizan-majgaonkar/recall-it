import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import {
  findDocumentByIdForUser,
  saveDocumentExtractionMetadata,
  updateDocumentProcessingStatus,
} from "@/server/repositories/document.repository";
import {
  createChunks,
  deleteChunksByDocumentId,
} from "@/server/repositories/chunk.repository";
import { extractDocumentTextFromR2 } from "@/server/modules/documents/text-extraction.service";
import { buildDocumentChunks } from "@/server/modules/documents/chunking.service";

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

    await saveDocumentExtractionMetadata({
      documentId: document.id,
      extractedPageCount: extracted.pageCount,
    });

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "chunking",
      processingError: null,
    });

    const builtChunks = buildDocumentChunks(extracted);

    await deleteChunksByDocumentId(document.id);

    const savedChunks = await createChunks(
      builtChunks.map((chunk) => ({
        documentId: document.id,
        chunkIndex: chunk.chunkIndex,
        sectionTitle: chunk.sectionTitle,
        sectionPath: chunk.sectionPath,
        headingLevel: chunk.headingLevel,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        isFullSection: chunk.isFullSection,
        overlapFromPrevious: chunk.overlapFromPrevious,
      })),
    );

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "chunked",
      processingError: null,
    });

    return Response.json({
      success: true,
      message: "Document chunked successfully",
      documentId: document.id,
      chunkCount: savedChunks.length,
      chunksPreview: savedChunks.slice(0, 3).map((chunk) => ({
        id: chunk.id,
        chunkIndex: chunk.chunkIndex,
        sectionTitle: chunk.sectionTitle,
        headingLevel: chunk.headingLevel,
        tokenCount: chunk.tokenCount,
        isFullSection: chunk.isFullSection,
        textPreview: chunk.text.slice(0, 300),
      })),
    });
  } catch (error) {
    console.error("Document chunking failed", error);

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "chunking_failed",
      processingError:
        error instanceof Error ? error.message : "Unknown chunking error",
    });

    return Response.json(
      {
        success: false,
        message: "Failed to chunk document",
      },
      { status: 500 },
    );
  }
}
