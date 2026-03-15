import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/modules/auth/auth.service";
import { DEFAULT_LOGIN_REDIRECT } from "./routes";

export async function redirectIfAuthenticated() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(DEFAULT_LOGIN_REDIRECT);
  }
}
