import { NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orders } from "@/db/schema";
import {
  markOrderPaid,
  markOrderPaymentFailed,
  orderAmountInPaise,
} from "@/lib/orders/payment";

/*
 * POST /api/razorpay/webhook
 * Server-to-server confirmation from Razorpay. Covers payments where the
 * browser never reached /api/razorpay/verify-payment (tab closed, network drop).
 *
 * Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://<your-domain>/api/razorpay/webhook
 *   Secret: same value as RAZORPAY_WEBHOOK_SECRET
 *   Events: payment.captured, order.paid, payment.failed
 */

interface RazorpayPaymentEntity {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
}

interface RazorpayWebhookBody {
  event: string;
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
  };
}

function isValidWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  // Signature is computed over the exact raw body
  const rawBody = await request.text();

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("[RAZORPAY_WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!isValidWebhookSignature(rawBody, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payment = body.payload?.payment?.entity;

  // Ignore events we don't handle (still 200 so Razorpay doesn't retry)
  if (!payment?.order_id) {
    return NextResponse.json({ received: true });
  }

  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.gatewayOrderId, payment.order_id))
      .limit(1);

    if (!order) {
      console.warn("[RAZORPAY_WEBHOOK] No order for gateway order", {
        event: body.event,
        gatewayOrderId: payment.order_id,
      });
      return NextResponse.json({ received: true });
    }

    switch (body.event) {
      case "payment.captured":
      case "order.paid": {
        // Defence in depth: charged amount must match the stored order total
        if (payment.currency !== "INR" || payment.amount !== orderAmountInPaise(order)) {
          console.error("[RAZORPAY_WEBHOOK] Amount mismatch", {
            orderId: order.id,
            expected: orderAmountInPaise(order),
            received: payment.amount,
            currency: payment.currency,
          });
          return NextResponse.json({ received: true });
        }

        const transitioned = await markOrderPaid(order, payment.id);
        console.log("[RAZORPAY_WEBHOOK]", body.event, {
          orderId: order.id,
          transitioned,
        });
        break;
      }

      case "payment.failed": {
        // No-op if the order was already paid (e.g. a later retry succeeded)
        await markOrderPaymentFailed(order.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // 5xx → Razorpay retries the delivery
    console.error("[RAZORPAY_WEBHOOK] Processing failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
