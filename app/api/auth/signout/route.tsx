import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { authTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // Extract token from cookie
    const cookies = request.headers.get("cookie");
    const token = cookies?.match(/authToken=([^;]+)/)?.[1];

    if (token) {
      // Delete token from auth_tokens table
      await db.delete(authTokens).where(eq(authTokens.token, token));
    }

    // Clear cookies
    const response = NextResponse.json({ message: "Signed out successfully" });
    response.cookies.set("authToken", "", { expires: new Date(0), path: "/" });
    response.cookies.set("userRole", "", { expires: new Date(0), path: "/" });
    return response;
  } catch (error) {
    console.error("Error signing out:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}