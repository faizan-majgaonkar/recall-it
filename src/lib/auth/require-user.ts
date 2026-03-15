import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/modules/auth/auth.service";

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
