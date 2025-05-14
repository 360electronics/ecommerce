import { db } from '@/db/drizzle';
import { coupons } from '@/db/schema';
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
      .from(coupons)
      .where(and(eq(coupons.code, code), eq(coupons.userId, userId)));

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code or unauthorized' }, { status: 404 });
    }

    if (coupon.isUsed) {
      return NextResponse.json({ error: 'Coupon already used' }, { status: 400 });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
    }

    return NextResponse.json({ amount: parseFloat(coupon.amount), id: coupon.id }, { status: 200 });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}