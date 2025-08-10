import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { orders } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const { orderId, cashfreeOrderId } = await request.json();

    await db
      .update(orders)
      .set({ cashfreeOrderId, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ message: 'Cashfree Payments order ID updated' }, { status: 200 });
  } catch (error) {
    console.error('Error updating Cashfree Payments order ID:', error);
    return NextResponse.json({ error: 'Failed to update Cashfree Payments order ID' }, { status: 500 });
  }
}