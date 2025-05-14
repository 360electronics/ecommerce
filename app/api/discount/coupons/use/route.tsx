import { db } from '@/db/drizzle';
import { coupons } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json({ error: 'Coupon code and user ID are required' }, { status: 400 });
    }

    const [updatedCoupon] = await db
      .update(coupons)
      .set({ isUsed: true })
      .where(and(eq(coupons.code, code), eq(coupons.userId, userId)))
      .returning();

    if (!updatedCoupon) {
      return NextResponse.json({ error: 'Coupon not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Coupon marked as used' }, { status: 200 });
  } catch (error) {
    console.error('Error marking coupon as used:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}