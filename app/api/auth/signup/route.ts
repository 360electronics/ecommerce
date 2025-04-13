import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { sendEmailOTP } from "@/lib/nodemailer";
import { generateOTP, storeOTP } from "@/utils/otp";
import { eq, or } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const { firstName, lastName, email, phoneNumber } = await request.json();

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
            .where(
                or(eq(users.email, email), eq(users.phoneNumber, phoneNumber))
            );

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: "User with this email or phone number already exists" },
                { status: 409 }
            );
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

        // Generate and store email OTP only
        const emailOTP = generateOTP();
        await storeOTP({ userId: newUser.id, otp: emailOTP, type: "email" });

        // Send email OTP
        const emailSent = await sendEmailOTP(email, emailOTP);

        if (!emailSent) {
            // Rollback user creation if OTP sending fails
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