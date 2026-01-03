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

    // Fetch all referrals where this user is the referrer
    const referralList = await db
      .select({
        referralId: referrals.id,
        status: referrals.status,
        referralCreatedAt: referrals.createdAt,

        // 👇 Referred user data
        userId: users.id,
        email: users.email,
        name: users.firstName,
        userCreatedAt: users.createdAt,

        // 👇 Coupon info
        couponId: coupons.id,
      })
      .from(referrals)
      // JOIN referred user
      .innerJoin(users, eq(referrals.userId, users.id))
      // Coupon may or may not exist
      .leftJoin(coupons, eq(coupons.referralId, referrals.id))
      // Only referrals created by this user
      .where(eq(referrals.referrerId, userId));

    // Normalize response for frontend
    const normalized = referralList.map((r) => ({
      id: r.referralId,
      status: r.status,
      createdAt: r.referralCreatedAt,

      referredUser: {
        id: r.userId,
        email: r.email,
        name: r.name,
        createdAt: r.userCreatedAt,
      },

      couponGenerated: Boolean(r.couponId),
    }));

    console.log(normalized)

    return NextResponse.json({ referrals: normalized }, { status: 200 });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
