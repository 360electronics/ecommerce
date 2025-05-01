import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { otpTokens, users, authTokens } from "@/db/schema";
import { generateToken } from "@/utils/jwt";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId, otp, type } = await request.json();

    if (!userId || !otp || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // Verify OTP
    const [otpRecord] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.userId, userId),
          eq(otpTokens.token, otp),
          eq(otpTokens.type, type)
        )
      );

    if (!otpRecord || !otpRecord.expiresAt || otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Update user verification status
    const updateData =
      type === "email"
        ? { emailVerified: true }
        : { phoneVerified: true };

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    // Delete used OTP
    await db
      .delete(otpTokens)
      .where(eq(otpTokens.id, otpRecord.id));
      
    if (!updatedUser.role) {
      return NextResponse.json(
        { error: "User role is missing" },
        { status: 400 }
      );
    }

    // Generate JWT
    const token = generateToken(userId, updatedUser.role);

    // Store auth token
    await db.insert(authTokens).values({
      userId,
      token,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
    });

    // Return token instead of setting cookie
    return NextResponse.json({
      message: "OTP verified",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        phoneVerified: updatedUser.phoneVerified,
      },
      token,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
