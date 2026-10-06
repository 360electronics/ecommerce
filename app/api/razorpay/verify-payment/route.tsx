import { NextResponse } from "next/server";
import crypto from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/server-auth";
import { markOrderPaid } from "@/lib/orders/payment";

function isValidSignature(gatewayOrderId: string, paymentId: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${gatewayOrderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const {
      payment_id,
      gateway_order_id,
      razorpay_signature,
      orderId,
      userId,
    } = await request.json();

    const auth = await requireUser(request, userId);
    if (auth.error) return auth.error;

    if (!payment_id || !gateway_order_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, auth.user.userId)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // The gateway order must be the one we created for THIS order (binds the amount)
    if (!order.gatewayOrderId || order.gatewayOrderId !== gateway_order_id) {
      return NextResponse.json({ error: "Payment does not match order" }, { status: 400 });
    }

    if (!isValidSignature(gateway_order_id, payment_id, razorpay_signature)) {
      await db
        .update(orders)
        .set({ paymentStatus: "failed", updatedAt: new Date() })
        .where(and(eq(orders.id, order.id), ne(orders.paymentStatus, "paid")));
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Idempotent — the webhook may have already confirmed it
    const transitioned = await markOrderPaid(order, payment_id);
    if (!transitioned) {
      return NextResponse.json(
        { message: "Payment already verified" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Payment verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
