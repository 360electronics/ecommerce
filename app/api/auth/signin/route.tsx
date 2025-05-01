import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { sendEmailOTP } from "@/lib/nodemailer";
import { sendSmsOTP } from "@/lib/twofactor_sms";
import { generateOTP, storeOTP } from "@/utils/otp";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { identifier, type } = await request.json(); 

    if (!identifier || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid identifier or type" },
        { status: 400 }
      );
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