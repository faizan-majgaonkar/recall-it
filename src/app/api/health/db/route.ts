import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const result = await db.execute("select 1 as ok");
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Database connection failed", error);
    return NextResponse.json(
      { success: false, message: "Database connection failed" },
      { status: 500 },
    );
  }
}
