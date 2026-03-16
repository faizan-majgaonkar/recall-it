import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";

export async function listDocumentsByUserId(userId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
}

export async function findDocumentByIdForUser(input: {
  documentId: string;
  userId: string;
}) {
  const [document] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, input.documentId),
        eq(documents.userId, input.userId),
      ),
    )
    .limit(1);

  return document ?? null;
}

export async function createDocument(input: {
  userId: string;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
  storageBucket: string;
  storageKey: string;
  checksum?: string | null;
  processingStatus?: string;
}) {
  const [document] = await db
    .insert(documents)
    .values({
      userId: input.userId,
      title: input.title,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageProvider: input.storageProvider,
      storageBucket: input.storageBucket,
      storageKey: input.storageKey,
      checksum: input.checksum ?? null,
      processingStatus: input.processingStatus ?? "uploaded",
    })
    .returning();

  return document;
}

export async function updateDocumentProcessingStatus(input: {
  documentId: string;
  processingStatus: string;
  processingError?: string | null;
}) {
  const [document] = await db
    .update(documents)
    .set({
      processingStatus: input.processingStatus,
      processingError: input.processingError ?? null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, input.documentId))
    .returning();

  return document ?? null;
}

export async function saveDocumentExtractionMetadata(input: {
  documentId: string;
  extractedPageCount: number | null;
}) {
  const [document] = await db
    .update(documents)
    .set({
      extractedPageCount: input.extractedPageCount,
      processingStatus: "text_extracted",
      processingError: null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, input.documentId))
    .returning();

  return document ?? null;
}
