import { setAuthCookie } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/api-error";
import { signup } from "@/server/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await signup(body);

    await setAuthCookie(result.token);

    return Response.json(
      {
        success: true,
        message: "Account created successfully",
        user: result.user,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
