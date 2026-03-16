import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/modules/auth/auth.service";

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAuthenticatedUserForApi() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
