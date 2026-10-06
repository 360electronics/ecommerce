import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { orders } from '@/db/schema';
import { requireUser } from '@/lib/server-auth';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/razorpay/create-order  { orderId }
// Amount always comes from the stored order, never from the client.
export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, auth.user.userId)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentMethod !== 'razorpay') {
      return NextResponse.json({ error: 'Order is not an online payment order' }, { status: 400 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 409 });
    }

    if (order.status !== 'pending' && order.status !== 'failed') {
      return NextResponse.json({ error: 'Order can no longer be paid' }, { status: 409 });
    }

    const amount = Math.round(Number(order.totalAmount) * 100);
    const currency = 'INR';

    // Reuse the existing gateway order on retry so earlier attempts still verify
    if (order.gatewayOrderId) {
      return NextResponse.json(
        { gatewayOrderId: order.gatewayOrderId, amount, currency },
        { status: 200 },
      );
    }

    const gatewayOrder = await razorpay.orders.create({
      amount,
      currency,
      receipt: `ord_${order.id}`.slice(0, 40),
      notes: { order_id: order.id },
    });

    const saved = await db
      .update(orders)
      .set({ gatewayOrderId: gatewayOrder.id, updatedAt: new Date() })
      .where(and(eq(orders.id, order.id), isNull(orders.gatewayOrderId)))
      .returning({ gatewayOrderId: orders.gatewayOrderId });

    // A concurrent request already bound a gateway order — use that one
    let gatewayOrderId = saved[0]?.gatewayOrderId ?? null;
    if (!gatewayOrderId) {
      const [current] = await db
        .select({ gatewayOrderId: orders.gatewayOrderId })
        .from(orders)
        .where(eq(orders.id, order.id));
      gatewayOrderId = current?.gatewayOrderId ?? null;
    }

    return NextResponse.json({ gatewayOrderId, amount, currency }, { status: 200 });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}
