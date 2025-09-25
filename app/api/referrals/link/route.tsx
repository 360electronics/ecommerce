import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { referrals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const referral = await db
      .select({ referralCode: referrals.referralCode })
      .from(referrals)
      .where(eq(referrals.userId, userId))
      .limit(1);

    if (referral.length === 0) {
      return NextResponse.json(
        { error: "No referral code found for this user" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}/signup?ref=${referral[0].referralCode}`;

    return NextResponse.json({
      referralCode: referral[0].referralCode,
      referralLink,
    });
  } catch (error) {
    console.error("Error fetching referral link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}