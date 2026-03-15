import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { listDocumentsByUserId } from "@/server/repositories/document.repository";

export async function getCurrentUserDocuments() {
  const user = await requireAuthenticatedUser();
  return listDocumentsByUserId(user.id);
}
