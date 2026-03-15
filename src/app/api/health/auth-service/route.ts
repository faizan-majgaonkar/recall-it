import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/modules/auth/auth.service";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Auth service health check failed", error);

    return NextResponse.json(
      { success: false, message: "Auth service health check failed" },
      { status: 500 },
    );
  }
}
