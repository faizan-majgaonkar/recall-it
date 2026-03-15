import { getAuthenticatedUser } from "@/server/modules/auth/auth.service";
import { listDocumentsByUserId } from "@/server/repositories/document.repository";

export async function getCurrentUserDocuments() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  return listDocumentsByUserId(user.id);
}
