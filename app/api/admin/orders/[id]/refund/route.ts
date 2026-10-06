import { NextResponse } from "next/server";
import { and, eq, inArray, isNotNull, lt, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orders } from "@/db/schema";
import { requireAdmin } from "@/lib/server-auth";
import { razorpay } from "@/lib/razorpay";

type Params = Promise<{ id: string }>;
type Order = typeof orders.$inferSelect;

const STALE_PROCESSING_MS = 10 * 60 * 1000;

// Razorpay refund status → our refund status
const mapRefundStatus = (status: string) =>
  status === "processed" ? "processed" : status === "failed" ? "failed" : "processing";

async function recordRefund(orderId: string, refund: { id: string; status: string }) {
  const refundStatus = mapRefundStatus(refund.status);
  const [updated] = await db
    .update(orders)
    .set({
      refundId: refund.id,
      refundStatus,
      ...(refundStatus === "processed"
        ? { paymentStatus: "refunded" as const, refundedAt: new Date() }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  return updated;
}

/*
 * POST /api/admin/orders/[id]/refund
 * Sends the recorded refund (paid amount minus cancellation charge) for a
 * cancelled Razorpay order. Admin-triggered only — never automatic.
 */
export async function POST(request: Request, { params }: { params: Params }) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  // 1️⃣ Claim the refund (pending/failed → processing) so two clicks can't both send money
  const [claimed] = await db
    .update(orders)
    .set({ refundStatus: "processing", updatedAt: new Date() })
    .where(
      and(
        eq(orders.id, id),
        eq(orders.status, "cancelled"),
        eq(orders.paymentMethod, "razorpay"),
        eq(orders.paymentStatus, "paid"),
        or(
          inArray(orders.refundStatus, ["pending", "failed"]),
          // A crashed attempt can be retried after 10 min (Razorpay lookup below
          // still prevents a double refund)
          and(
            eq(orders.refundStatus, "processing"),
            lt(orders.updatedAt, new Date(Date.now() - STALE_PROCESSING_MS)),
          ),
        ),
        isNotNull(orders.paymentId),
      ),
    )
    .returning();

  if (!claimed) {
    const [order] = await db
      .select({ status: orders.status, refundStatus: orders.refundStatus, paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    const message = !order
      ? "Order not found"
      : order.refundStatus === "processing"
        ? "A refund is already in progress for this order"
        : order.refundStatus === "processed" || order.paymentStatus === "refunded"
          ? "This order has already been refunded"
          : order.status !== "cancelled"
            ? "Only cancelled orders can be refunded"
            : "No refund is due for this order";
    return NextResponse.json({ error: message }, { status: order ? 409 : 404 });
  }

  const order: Order = claimed;
  const amountPaise = Math.round(Number(order.refundAmount ?? 0) * 100);

  if (amountPaise <= 0) {
    await db
      .update(orders)
      .set({ refundStatus: "not_applicable", updatedAt: new Date() })
      .where(eq(orders.id, id));
    return NextResponse.json({ error: "Refund amount is zero — nothing to refund" }, { status: 409 });
  }

  try {
    // 2️⃣ If an earlier attempt reached Razorpay but our response was lost, reuse
    //    that refund instead of refunding twice
    const existing = await razorpay.payments.fetchMultipleRefund(order.paymentId!, { count: 100 });
    const previous = existing.items?.find(
      (r) => (r.notes as Record<string, string> | undefined)?.order_id === order.id && r.status !== "failed",
    );

    const refund =
      previous ??
      (await razorpay.payments.refund(order.paymentId!, {
        amount: amountPaise,
        speed: "normal",
        notes: {
          order_id: order.id,
          reason: `Order cancelled by ${order.cancelledBy ?? "store"}`,
          refunded_by: admin.user.userId,
        },
      }));

    const updated = await recordRefund(order.id, refund);
    console.info("[ADMIN_REFUND]", { orderId: order.id, refundId: refund.id, status: refund.status, by: admin.user.userId });

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      refundStatus: updated?.refundStatus,
      amount: amountPaise / 100,
    });
  } catch (error: any) {
    // Release the claim so the admin can retry
    await db
      .update(orders)
      .set({ refundStatus: "failed", updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.refundStatus, "processing")));

    const description = error?.error?.description ?? error?.message ?? "Refund failed";
    console.error("[ADMIN_REFUND_ERROR]", { orderId: id, error: description });
    return NextResponse.json({ error: `Razorpay: ${description}` }, { status: 502 });
  }
}
