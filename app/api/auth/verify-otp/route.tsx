import { NextResponse } from "next/server"
import { db } from "@/db/drizzle"
import { otpTokens, users, authTokens, referrals, coupons } from "@/db/schema"
import { generateToken } from "@/utils/jwt"
import { generateCouponCode } from "@/utils/refferal.utils"
import { eq, and } from "drizzle-orm"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { userId, otp, type } = await request.json()

    // Validate input
    if (!userId || !otp || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid input: userId, otp, and type (email or phone) are required" },
        { status: 400 },
      )
    }

    // Verify OTP
    const [otpRecord] = await db
      .select({
        id: otpTokens.id,
        userId: otpTokens.userId,
        expiresAt: otpTokens.expiresAt,
      })
      .from(otpTokens)
      .where(and(eq(otpTokens.userId, userId), eq(otpTokens.token, otp), eq(otpTokens.type, type)))
      .limit(1)

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    if (!otpRecord.expiresAt || otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 })
    }

    const now = new Date()

    const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let newRole = currentUser.role
    if (currentUser.role === "guest") {
      // Upgrade to regular user if they have both email and phone, or if they're verifying their second contact method
      const hasEmail = currentUser.email !== null
      const hasPhone = currentUser.phoneNumber !== null
      const isVerifyingEmail = type === "email" && hasEmail
      const isVerifyingPhone = type === "phone" && hasPhone

      if (
        (hasEmail && hasPhone) ||
        (isVerifyingEmail && currentUser.phoneVerified) ||
        (isVerifyingPhone && currentUser.emailVerified)
      ) {
        newRole = "user"
      }
    }

    // Update user verification status, role, and lastLogin timestamp
    const updateData = {
      ...(type === "email" ? { emailVerified: true } : { phoneVerified: true }),
      role: newRole,
      lastLogin: now,
    }

    const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phoneNumber: users.phoneNumber,
      role: users.role,
      emailVerified: users.emailVerified,
      phoneVerified: users.phoneVerified,
      lastLogin: users.lastLogin,
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!updatedUser.role) {
      return NextResponse.json({ error: "User role is missing" }, { status: 400 })
    }

    // Delete used OTP
    await db.delete(otpTokens).where(eq(otpTokens.id, otpRecord.id))

    // Generate JWT
    const token = generateToken(userId, updatedUser.role)

    // Store auth token
    await db.insert(authTokens).values({
      userId,
      token,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
    })

    // Handle referral and coupon logic
    const [referralRecord] = await db
      .select({
        id: referrals.id,
        referrerId: referrals.referrerId,
        status: referrals.status,
      })
      .from(referrals)
      .where(eq(referrals.userId, userId))
      .limit(1)

    if (referralRecord && referralRecord.referrerId && referralRecord.status !== "completed") {
      // Update referral status
      await db.update(referrals).set({ status: "completed" }).where(eq(referrals.id, referralRecord.id))

      // Generate unique coupon code
      let couponCode: string
      let isUnique = false
      do {
        couponCode = generateCouponCode()
        const existingCoupon = await db
          .select({ id: coupons.id })
          .from(coupons)
          .where(eq(coupons.code, couponCode))
          .limit(1)
        isUnique = existingCoupon.length === 0
      } while (!isUnique)

      await db.insert(coupons).values({
        userId: referralRecord.referrerId,
        referralId: referralRecord.id,
        code: couponCode,
        amount: "100", // String for numeric type
        isUsed: false,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: now,
      })
    }

    // Create response with authToken cookie
    const response = NextResponse.json({
      message: "OTP verified",
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        phoneVerified: updatedUser.phoneVerified,
        lastLogin: updatedUser.lastLogin,
      },
      token: token,
      wasUpgraded: newRole !== currentUser.role,
    })

    // Set authToken cookie (HTTP-only, secure)
    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 12 * 60 * 60, // 12 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("OTP verification error:", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
