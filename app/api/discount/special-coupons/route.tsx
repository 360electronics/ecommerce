import { db } from '@/db/drizzle';
import { specialCoupons, specialCouponUsage } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('userId');

    if (!code || !userId) {
      return NextResponse.json({ error: 'Coupon code and user ID are required' }, { status: 400 });
    }

    const [coupon] = await db
      .select()
      .from(specialCoupons)
      .where(eq(specialCoupons.code, code));

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
    }

    if (parseFloat(coupon.limit) <= 0) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    // Check if user has already used this coupon
    const [usage] = await db
      .select()
      .from(specialCouponUsage)
      .where(and(
        eq(specialCouponUsage.userId, userId),
        eq(specialCouponUsage.couponId, coupon.id)
      ));

    if (usage) {
      return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
    }

    return NextResponse.json({
      amount: coupon.amount ? parseFloat(coupon.amount) : null,
      percentage: coupon.percentage ? parseFloat(coupon.percentage) : null,
      id: coupon.id,
    }, { status: 200 });
  } catch (error) {
    console.error('Error validating special coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}