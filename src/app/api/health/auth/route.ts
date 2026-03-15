import { NextResponse } from "next/server";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const token = await signSessionToken({
      sub: "test-user-id",
      sid: "test-session-id",
      jti: "test-token-jti",
      email: "test@example.com",
    });

    const payload = await verifySessionToken(token);

    return NextResponse.json({
      success: true,
      token,
      payload,
    });
  } catch (error) {
    console.error("Auth utility test failed", error);

    return NextResponse.json(
      { success: false, message: "Auth utility test failed" },
      { status: 500 },
    );
  }
}
