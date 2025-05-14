import { db } from '@/db/drizzle';
import { specialCoupons, specialCouponUsage } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json({ error: 'Coupon code and user ID are required' }, { status: 400 });
    }

    const [coupon] = await db
      .select()
      .from(specialCoupons)
      .where(eq(specialCoupons.code, code));

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const [existingUsage] = await db
      .select()
      .from(specialCouponUsage)
      .where(and(
        eq(specialCouponUsage.userId, userId),
        eq(specialCouponUsage.couponId, coupon.id)
      ));

    if (existingUsage) {
      return NextResponse.json({ error: 'Coupon already used by this user' }, { status: 400 });
    }

    await db.insert(specialCouponUsage).values({
      userId,
      couponId: coupon.id,
    });

    // Optionally decrement the limit (if tracking total usage)
    await db
      .update(specialCoupons)
      .set({ limit: sql`${specialCoupons.limit} - 1` })
      .where(eq(specialCoupons.id, coupon.id));

    return NextResponse.json({ message: 'Coupon usage recorded' }, { status: 200 });
  } catch (error) {
    console.error('Error recording special coupon usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}