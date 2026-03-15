import { ZodError } from "zod";
import { AuthError } from "@/server/modules/auth/auth.errors";

export function toErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        success: false,
        message: "Invalid request data",
        issues: error.flatten(),
      },
      { status: 400 },
    );
  }

  console.error(error);

  return Response.json(
    {
      success: false,
      message: "Internal server error",
    },
    { status: 500 },
  );
}
