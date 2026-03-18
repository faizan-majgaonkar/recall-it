import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import {
  findDocumentByIdForUser,
  saveDocumentExtractionMetadata,
  updateDocumentProcessingStatus,
} from "@/server/repositories/document.repository";
import {
  createChunks,
  deleteChunksByDocumentId,
  listChunksByDocumentId,
} from "@/server/repositories/chunk.repository";
import {
  createConceptChunkLinks,
  createConcepts,
  deleteConceptsByDocumentId,
} from "@/server/repositories/concept.repository";
import { extractDocumentTextFromR2 } from "@/server/modules/documents/text-extraction.service";
import { buildDocumentChunks } from "@/server/modules/documents/chunking.service";
import { extractConceptsFromChunks } from "@/server/modules/documents/concept-extraction.service";
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

    await createChunks(
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

    const chunks = await listChunksByDocumentId(document.id);

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "extracting_concepts",
      processingError: null,
    });

    const extractedConcepts = await extractConceptsFromChunks(
      chunks.map((chunk) => ({
        id: chunk.id,
        sectionTitle: chunk.sectionTitle,
        sectionPath: chunk.sectionPath,
        text: chunk.text,
      })),
    );

    await deleteConceptsByDocumentId(document.id);

    const savedConcepts = await createConcepts(
      extractedConcepts.map((concept) => ({
        documentId: document.id,
        name: concept.name,
        normalizedName: concept.normalizedName,
        summary: concept.summary,
      })),
    );

    const conceptIdByNormalizedName = new Map(
      savedConcepts.map((concept) => [concept.normalizedName, concept.id]),
    );

    const chunkIdSet = new Set(chunks.map((chunk) => chunk.id));

    const linksToCreate = extractedConcepts.flatMap((concept) => {
      const conceptId = conceptIdByNormalizedName.get(concept.normalizedName);
      if (!conceptId) return [];
      return concept.supportingChunkIds
        .filter((chunkId) => chunkIdSet.has(chunkId))
        .map((chunkId) => ({ conceptId, chunkId }));
    });

    await createConceptChunkLinks(linksToCreate);

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "concepts_extracted",
      processingError: null,
    });

    await embedDocumentChunks(document.id);

    return Response.json({
      success: true,
      message: "Document processed successfully",
    });
  } catch (error) {
    console.error("Document processing failed:", error);

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "processing_failed",
      processingError:
        error instanceof Error ? error.message : "Unknown processing error",
    }).catch(() => {});

    return Response.json(
      { success: false, message: "Failed to process document" },
      { status: 500 },
    );
  }
}
