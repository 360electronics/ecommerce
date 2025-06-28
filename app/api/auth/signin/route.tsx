import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, referrals } from "@/db/schema";
import { sendEmailOTP } from "@/lib/nodemailer";
import { sendSmsOTP } from "@/lib/twofactor_sms";
import { generateOTP, storeOTP } from "@/utils/otp";
import { generateReferralCode } from "@/utils/refferal.utils";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { identifier, type, referralCode } = await request.json(); 

    if (!identifier || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid identifier or type" },
        { status: 400 }
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

    // Check if user exists
    let user;
    if (type === "email") {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, identifier));
    } else {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.phoneNumber, identifier));
    }

    // If user doesn't exist, create a guest user
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: type === "email" ? identifier : null,
          phoneNumber: type === "phone" ? identifier : null,
          role: "guest",
          emailVerified: false,
          phoneVerified: false,
        })
        .returning();
      user = newUser;

      // Generate a unique referral code for the new guest user
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
    }

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP({ userId: user.id, otp, type });

    // Send OTP
    const sent =
      type === "email"
        ? await sendEmailOTP(identifier, otp)
        : await sendSmsOTP(identifier, otp);

    if (!sent) {
      // Rollback user creation and referral if OTP sending fails
      if (!user.emailVerified && !user.phoneVerified) {
        await db.delete(referrals).where(eq(referrals.userId, user.id));
        await db.delete(users).where(eq(users.id, user.id));
      }
      return NextResponse.json(
        { error: `Failed to send ${type} OTP` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "OTP sent",
      userId: user.id,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}