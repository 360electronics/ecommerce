import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { verifyToken } from "@/utils/jwt";
import { eq } from "drizzle-orm";

interface UpdateRequest {
  firstName: string;
  email: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get authToken from cookies
    const token = request.headers.get("cookie")?.match(/authToken=([^;]+)/)?.[1];
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify JWT
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }

    // Parse request body
    const { firstName, email }: UpdateRequest = await request.json();
    if (!firstName || !email) {
      return NextResponse.json(
        { error: "Invalid input: firstName and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Update user in database
    const [updatedUser] = await db
      .update(users)
      .set({ firstName, email })
      .where(eq(users.id, payload.userId))
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
      });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}