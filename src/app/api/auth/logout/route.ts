import { clearAuthCookie } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/api-error";
import { logoutCurrentSession } from "@/server/modules/auth/auth.service";

export async function POST() {
  try {
    await logoutCurrentSession();
    await clearAuthCookie();

    return Response.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
