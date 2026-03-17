import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import {
  findDocumentByIdForUser,
  updateDocumentProcessingStatus,
} from "@/server/repositories/document.repository";
import { listChunksByDocumentId } from "@/server/repositories/chunk.repository";
import {
  createConceptChunkLinks,
  createConcepts,
  deleteConceptsByDocumentId,
} from "@/server/repositories/concept.repository";
import { extractConceptsFromChunks } from "@/server/modules/documents/concept-extraction.service";

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
    const chunks = await listChunksByDocumentId(document.id);

    if (chunks.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Document has no stored chunks. Chunk the document first.",
        },
        { status: 400 },
      );
    }

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

      if (!conceptId) {
        return [];
      }

      return concept.supportingChunkIds
        .filter((chunkId) => chunkIdSet.has(chunkId))
        .map((chunkId) => ({
          conceptId,
          chunkId,
        }));
    });

    await createConceptChunkLinks(linksToCreate);

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "concepts_extracted",
      processingError: null,
    });

    return Response.json({
      success: true,
      message: "Concepts extracted successfully",
      documentId: document.id,
      conceptCount: savedConcepts.length,
      linkCount: linksToCreate.length,
      conceptsPreview: savedConcepts.slice(0, 10),
    });
  } catch (error) {
    console.error("Concept extraction failed", error);

    await updateDocumentProcessingStatus({
      documentId: document.id,
      processingStatus: "concept_extraction_failed",
      processingError:
        error instanceof Error
          ? error.message
          : "Unknown concept extraction error",
    });

    return Response.json(
      {
        success: false,
        message: "Failed to extract concepts",
      },
      { status: 500 },
    );
  }
}
