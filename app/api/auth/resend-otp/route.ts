import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { sendEmailOTP } from "@/lib/nodemailer";
import { sendSmsOTP } from "@/lib/twofactor_sms";
import { generateOTP, storeOTP } from "@/utils/otp";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId, type } = await request.json();

    if (!userId || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // Fetch user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate and store new OTP
    const otp = generateOTP();
    await storeOTP({ userId, otp, type });

    // Send OTP
    const identifier = type === "email" ? user.email : user.phoneNumber;
    if (!identifier) {
      return NextResponse.json(
        { error: `No ${type} associated with this user` },
        { status: 400 }
      );
    }

    const sent =
      type === "email"
        ? await sendEmailOTP(identifier, otp)
        : await sendSmsOTP(identifier, otp);

    if (!sent) {
      return NextResponse.json(
        { error: `Failed to send ${type} OTP` },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OTP resent" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}