import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { orders } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const { orderId, razorpayOrderId } = await request.json();

    await db
      .update(orders)
      .set({ razorpayOrderId, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ message: 'Razorpay order ID updated' }, { status: 200 });
  } catch (error) {
    console.error('Error updating Razorpay order ID:', error);
    return NextResponse.json({ error: 'Failed to update Razorpay order ID' }, { status: 500 });
  }
}