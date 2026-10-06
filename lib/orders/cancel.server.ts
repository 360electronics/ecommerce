import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orders } from "@/db/schema";
import { getCheckoutSettings } from "@/lib/settings/checkout-settings.server";
import { sendOrderStatusUpdateEmail } from "@/lib/nodemailer";
import { getOrderEmailData } from "@/lib/order-email-helper";
import { quoteCancellation, type CancelInitiator, type CancellationQuote } from "./cancellation";

type Order = typeof orders.$inferSelect;

export type CancelResult =
  | { ok: true; order: Order; quote: CancellationQuote }
  | { ok: false; status: number; error: string };

export async function loadOrderForCancel(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return order ?? null;
}

export async function previewCancellation(order: Order, initiatedBy: CancelInitiator) {
  const { cancellation } = await getCheckoutSettings();
  return quoteCancellation(order, initiatedBy, cancellation);
}

/**
 * Cancel an order and record the charge / refund. Uses the status read at
 * quote time as an optimistic lock, so a concurrent status change (e.g. the
 * order ships while the customer is confirming) can't be charged at the
 * wrong stage — the update simply doesn't match and we report a conflict.
 * No money moves here: refunds are sent separately by an admin.
 */
export async function cancelOrder(
  order: Order,
  initiatedBy: CancelInitiator,
  reason: string | null,
): Promise<CancelResult> {
  const quote = await previewCancellation(order, initiatedBy);
  if (!quote.allowed) {
    return { ok: false, status: 409, error: quote.reason ?? "Order can't be cancelled" };
  }

  const now = new Date();
  const [updated] = await db
    .update(orders)
    .set({
      status: "cancelled",
      // Prepaid money stays "paid" until the refund is sent; nothing was paid otherwise
      paymentStatus: quote.paidAmount > 0 ? order.paymentStatus : "cancelled",
      cancelledBy: initiatedBy,
      cancellationReason: reason?.trim().slice(0, 500) || null,
      cancelledAt: now,
      cancellationChargePercent: quote.chargePercent.toFixed(2),
      cancellationCharge: quote.charge.toFixed(2),
      refundAmount: quote.refundAmount.toFixed(2),
      refundStatus: quote.refundStatus,
      updatedAt: now,
    })
    .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
    .returning();

  if (!updated) {
    return {
      ok: false,
      status: 409,
      error: "The order status changed. Please refresh and try again.",
    };
  }

  // Status email (non-blocking)
  getOrderEmailData(order.id)
    .then((emailData) => {
      if (emailData) {
        sendOrderStatusUpdateEmail(
          {
            orderId: emailData.orderId,
            customerName: emailData.customerName,
            customerEmail: emailData.customerEmail,
            totalAmount: emailData.totalAmount,
          },
          "cancelled",
        );
      }
    })
    .catch((err) => console.error("[ORDER_CANCEL_EMAIL_ERROR]", err));

  return { ok: true, order: updated, quote };
}
