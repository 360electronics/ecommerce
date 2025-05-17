import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { coupons, referrals, users } from "@/db/schema";
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

    // Find the user's referral code
    const userReferral = await db
      .select({ referralCode: referrals.referralCode })
      .from(referrals)
      .where(eq(referrals.userId, userId))
      .limit(1);

    if (userReferral.length === 0) {
      return NextResponse.json([], { status: 200 }); // No referrals yet
    }

    // Find all referrals where this user is the referrer
    const referralList = await db
      .select({
        id: referrals.id,
        referredEmail: users.email,
        signupDate: users.createdAt,
        status: referrals.status, // Assumes status field exists (see below)
        couponGenerated: coupons.id, // Assumes coupons table (see below)
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.userId, users.id))
      .leftJoin(coupons, eq(coupons.referralId, referrals.id))
      .where(eq(referrals.referrerId, userId));

    return NextResponse.json(referralList);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}