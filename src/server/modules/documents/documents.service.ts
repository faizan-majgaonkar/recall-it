import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  createDocument,
  listDocumentsByUserId,
} from "@/server/repositories/document.repository";

export async function getCurrentUserDocuments() {
  const user = await requireAuthenticatedUser();
  return listDocumentsByUserId(user.id);
}

export async function createCurrentUserDocument(input: {
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
  const user = await requireAuthenticatedUser();

  return createDocument({
    userId: user.id,
    title: input.title,
    originalFileName: input.originalFileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    storageProvider: input.storageProvider,
    storageBucket: input.storageBucket,
    storageKey: input.storageKey,
    checksum: input.checksum ?? null,
    processingStatus: input.processingStatus ?? "uploaded",
  });
}
