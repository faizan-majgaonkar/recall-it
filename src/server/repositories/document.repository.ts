import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";

export async function listDocumentsByUserId(userId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
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
