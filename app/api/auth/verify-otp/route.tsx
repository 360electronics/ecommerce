import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { otpTokens, users, authTokens, referrals, coupons } from "@/db/schema";
import { generateToken } from "@/utils/jwt";
import { generateCouponCode } from "@/utils/refferal.utils";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { userId, otp, type } = await request.json();

    // Validate input
    if (!userId || !otp || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid input: userId, otp, and type (email or phone) are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const [otpRecord] = await db
      .select({
        id: otpTokens.id,
        userId: otpTokens.userId,
        expiresAt: otpTokens.expiresAt,
      })
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.userId, userId),
          eq(otpTokens.token, otp),
          eq(otpTokens.type, type)
        )
      )
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (!otpRecord.expiresAt || otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "OTP expired" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Start a transaction for user update, OTP deletion, and auth token insertion
    const result = await db.transaction(async (tx) => {
      // Update user verification status and lastLogin timestamp
      const updateData =
        type === "email"
          ? { emailVerified: true, lastLogin: now }
          : { phoneVerified: true, lastLogin: now };

      const [updatedUser] = await tx
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          email: users.email,
          phoneNumber: users.phoneNumber,
          role: users.role,
          emailVerified: users.emailVerified,
          phoneVerified: users.phoneVerified,
          lastLogin: users.lastLogin,
        });

      if (!updatedUser) {
        throw new Error("User not found");
      }

      if (!updatedUser.role) {
        throw new Error("User role is missing");
      }

      // Delete used OTP
      await tx
        .delete(otpTokens)
        .where(eq(otpTokens.id, otpRecord.id));

      // Generate JWT
      const token = generateToken(userId, updatedUser.role);

      // Store auth token
      await tx.insert(authTokens).values({
        userId,
        token,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      });

      return { updatedUser, token };
    });

    // Handle referral and coupon logic (outside transaction to avoid locking)
    const [referralRecord] = await db
      .select({
        id: referrals.id,
        referrerId: referrals.referrerId,
        status: referrals.status,
      })
      .from(referrals)
      .where(eq(referrals.userId, userId))
      .limit(1);

    if (referralRecord && referralRecord.referrerId && referralRecord.status !== "completed") {
      // Update referral status
      await db
        .update(referrals)
        .set({ status: "completed" })
        .where(eq(referrals.id, referralRecord.id));

      // Generate unique coupon code
      let couponCode: string;
      let isUnique = false;
      do {
        couponCode = generateCouponCode();
        const existingCoupon = await db
          .select({ id: coupons.id })
          .from(coupons)
          .where(eq(coupons.code, couponCode))
          .limit(1);
        isUnique = existingCoupon.length === 0;
      } while (!isUnique);

      await db.insert(coupons).values({
        userId: referralRecord.referrerId,
        referralId: referralRecord.id,
        code: couponCode,
        amount: "100", // String for numeric type
        isUsed: false,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: now,
      });
    }

    // Create response with authToken cookie
    const response = NextResponse.json({
      message: "OTP verified",
      user: {
        id: result.updatedUser.id,
        email: result.updatedUser.email,
        phoneNumber: result.updatedUser.phoneNumber,
        role: result.updatedUser.role,
        emailVerified: result.updatedUser.emailVerified,
        phoneVerified: result.updatedUser.phoneVerified,
        lastLogin: result.updatedUser.lastLogin,
      },
      token: result.token,
    });

    // Set authToken cookie (HTTP-only, secure)
    response.cookies.set("authToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60, // 12 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OTP verification error:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}