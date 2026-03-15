import { setAuthCookie } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/api-error";
import { login } from "@/server/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await login(body);

    await setAuthCookie(result.token);

    return Response.json({
      success: true,
      message: "Logged in successfully",
      user: result.user,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
