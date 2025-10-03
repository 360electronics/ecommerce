import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { orders } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const { orderId, gatewayOrderId } = await request.json();

    await db
      .update(orders)
      .set({ gatewayOrderId, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ message: 'Gateway Payments order ID updated' }, { status: 200 });
  } catch (error) {
    console.error('Error updating Gateway Payments order ID:', error);
    return NextResponse.json({ error: 'Failed to update Gateway Payments order ID' }, { status: 500 });
  }
}