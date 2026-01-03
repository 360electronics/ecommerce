import { db } from '@/db/drizzle';
import { specialCoupons, specialCouponUsage } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("userId");
    const cartTotal = Number(searchParams.get("cartTotal"));

    if (!code || !userId || isNaN(cartTotal)) {
      return NextResponse.json(
        { error: "Invalid request data", code: "INVALID" },
        { status: 400 }
      );
    }

    const [coupon] = await db
      .select()
      .from(specialCoupons)
      .where(eq(specialCoupons.code, code));

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code", code: "INVALID" },
        { status: 404 }
      );
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json(
        { error: "Coupon expired", code: "EXPIRED" },
        { status: 400 }
      );
    }

    if (Number(coupon.limit) <= 0) {
      return NextResponse.json(
        { error: "Coupon usage limit reached", code: "LIMIT_REACHED" },
        { status: 400 }
      );
    }

    if (cartTotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json(
        {
          error: `Minimum order value is ₹${coupon.minOrderAmount}`,
          code: "MIN_AMOUNT_NOT_MET",
        },
        { status: 400 }
      );
    }

    const [usage] = await db
      .select()
      .from(specialCouponUsage)
      .where(
        and(
          eq(specialCouponUsage.userId, userId),
          eq(specialCouponUsage.couponId, coupon.id)
        )
      );

    if (usage) {
      return NextResponse.json(
        { error: "Coupon already used", code: "USED" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        id: coupon.id,
        type: coupon.amount ? "amount" : "percentage",
        value: coupon.amount
          ? Number(coupon.amount)
          : Number(coupon.percentage),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Special coupon validation error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
