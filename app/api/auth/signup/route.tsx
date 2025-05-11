import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, referrals } from "@/db/schema";
import { sendEmailOTP } from "@/lib/nodemailer";
import { generateOTP, storeOTP } from "@/utils/otp";
import { eq, or } from "drizzle-orm";
import { generateReferralCode } from "@/utils/refferal.utils";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { firstName, lastName, email, phoneNumber, referralCode } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !phoneNumber) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.phoneNumber, phoneNumber)));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email or phone number already exists" },
        { status: 409 }
      );
    }

    // Validate referral code (if provided)
    let referrerId: string | null = null;
    if (referralCode) {
      const referral = await db
        .select({ userId: referrals.userId })
        .from(referrals)
        .where(eq(referrals.referralCode, referralCode))
        .limit(1);

      if (referral.length === 0) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 400 }
        );
      }
      referrerId = referral[0].userId;
    }

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        phoneNumber,
        role: "user",
        emailVerified: false,
        phoneVerified: false,
      })
      .returning();

    // Generate a unique referral code for the new user
    let newReferralCode: string;
    let isUnique = false;
    do {
      newReferralCode = generateReferralCode();
      const existingCode = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referralCode, newReferralCode));
      isUnique = existingCode.length === 0;
    } while (!isUnique);

    // Store referral information
    await db
      .insert(referrals)
      .values({
        userId: newUser.id,
        referralCode: newReferralCode,
        referrerId,
      });

    // Generate and store email OTP
    const emailOTP = generateOTP();
    await storeOTP({ userId: newUser.id, otp: emailOTP, type: "email" });

    // Send email OTP
    const emailSent = await sendEmailOTP(email, emailOTP);

    if (!emailSent) {
      // Rollback user creation and referral
      await db.delete(referrals).where(eq(referrals.userId, newUser.id));
      await db.delete(users).where(eq(users.id, newUser.id));
      return NextResponse.json(
        { error: "Failed to send email verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "User created, email verification sent",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}