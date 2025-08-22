import { NextResponse } from "next/server"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { sendEmailOTP } from "@/lib/nodemailer"
import { sendSmsOTP } from "@/lib/twofactor_sms"
import { generateOTP, storeOTP } from "@/utils/otp"
import { verifyToken } from "@/utils/jwt"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    // Get authToken from cookies
    const token = request.headers.get("cookie")?.match(/authToken=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    // Verify JWT
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 })
    }

    const { type } = await request.json()

    if (!["email", "phone"].includes(type)) {
      return NextResponse.json({ error: "Invalid verification type" }, { status: 400 })
    }

    // Fetch user
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId))

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already verified
    if (type === "email" && user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    if (type === "phone" && user.phoneVerified) {
      return NextResponse.json({ error: "Phone is already verified" }, { status: 400 })
    }

    // Generate and store new OTP
    const otp = generateOTP()
    await storeOTP({ userId: payload.userId, otp, type })

    // Send OTP
    const identifier = type === "email" ? user.email : user.phoneNumber
    if (!identifier) {
      return NextResponse.json({ error: `No ${type} associated with this user` }, { status: 400 })
    }

    const sent = type === "email" ? await sendEmailOTP(identifier, otp) : await sendSmsOTP(identifier, otp)

    if (!sent) {
      return NextResponse.json({ error: `Failed to send ${type} verification` }, { status: 500 })
    }

    return NextResponse.json({
      message: `Verification ${type === "email" ? "email" : "SMS"} sent successfully`,
      userId: payload.userId,
    })
  } catch (error) {
    console.error("Request verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
