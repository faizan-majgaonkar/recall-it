import { toErrorResponse } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/server/modules/auth/auth.service";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return Response.json(
        {
          success: false,
          user: null,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    return Response.json({
      success: true,
      user,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
