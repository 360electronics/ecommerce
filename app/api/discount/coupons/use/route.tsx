import { db } from "@/db/drizzle";
import { coupons } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Coupon code and user ID are required", code: "INVALID" },
        { status: 400 }
      );
    }

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, code), eq(coupons.userId, userId)));

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found or unauthorized", code: "UNAUTHORIZED" },
        { status: 404 }
      );
    }

    if (coupon.isUsed) {
      return NextResponse.json(
        { error: "Coupon already used", code: "USED" },
        { status: 400 }
      );
    }

    await db
      .update(coupons)
      .set({ isUsed: true })
      .where(eq(coupons.id, coupon.id));

    return NextResponse.json(
      { message: "Coupon marked as used" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Coupon usage error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
