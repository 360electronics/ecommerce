import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { verifyToken } from "@/utils/jwt";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const token = request.headers
      .get("cookie")
      ?.match(/authToken=([^;]+)/)?.[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { firstName, lastName, email, phoneNumber } = await request.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name and email are required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        email,
        phoneNumber,
        role: "user",
      })
      .where(eq(users.id, payload.userId))
      .returning();

    return NextResponse.json({
      message: "Account upgraded successfully",
      user,
    });
  } catch (err: any) {
    console.error("Upgrade account error:", err);

    // 🔥 UNIQUE CONSTRAINT HANDLING
    if (err?.code === "23505") {
      if (err.constraint === "users_phone_number_unique") {
        return NextResponse.json(
          { error: "Phone number already in use" },
          { status: 409 }
        );
      }

      if (err.constraint === "users_email_unique") {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
