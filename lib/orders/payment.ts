import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { checkout, orders } from "@/db/schema";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "@/lib/nodemailer";
import { getOrderEmailData } from "@/lib/order-email-helper";
import { consumeCoupon } from "@/lib/coupon-service";
import { flagStockIssue, releaseOrderStock, reserveOrderStock } from "./stock";

type Order = typeof orders.$inferSelect;

/**
 * Mark an online order as paid + confirmed. Idempotent: only the first caller
 * (browser verify or Razorpay webhook, whichever lands first) performs the
 * side effects — checkout cleanup, coupon consumption, confirmation emails.
 * Returns true if this call transitioned the order.
 */
export async function markOrderPaid(order: Order, paymentId: string): Promise<boolean> {
  const updated = await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      paymentId,
      status: "confirmed",
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, order.id), ne(orders.paymentStatus, "paid")))
    .returning({ id: orders.id });

  if (updated.length === 0) return false;

  // Stock: normally still reserved from order creation. If it was released
  // (payment failed/dismissed first, or abandoned >30 min) take it again; if it
  // has sold out meanwhile, keep the order paid but flag it for the admin.
  try {
    const stock = await reserveOrderStock(order.id);
    if (stock === "insufficient") {
      await flagStockIssue(order.id);
      console.warn("[ORDER_PAID_OUT_OF_STOCK]", { orderId: order.id });
    }
  } catch (e) {
    console.error("[ORDER_PAID_STOCK_ERROR]", { orderId: order.id, error: e });
  }

  // Clear any leftover checkout rows for this order's session
  await db
    .delete(checkout)
    .where(eq(checkout.checkoutSessionId, order.checkoutSessionId))
    .catch((e) => console.error("[ORDER_CHECKOUT_CLEANUP_ERROR]", e));

  if (order.couponCode) {
    const consumed = await consumeCoupon(order.couponCode, order.userId).catch((e) => {
      console.error("[ORDER_COUPON_CONSUME_ERROR]", e);
      return false;
    });
    if (!consumed) {
      console.warn("[ORDER_COUPON_NOT_CONSUMED]", { orderId: order.id, code: order.couponCode });
    }
  }

  // Send confirmation emails (non-blocking)
  getOrderEmailData(order.id).then((emailData) => {
    if (emailData) {
      sendOrderConfirmationEmail(emailData);
      sendAdminOrderNotification(emailData);
    }
  }).catch((err) => console.error("[ORDER_EMAIL_FETCH_ERROR]", err));

  return true;
}

// Mark an unpaid online order's payment as failed (never touches paid orders).
export async function markOrderPaymentFailed(orderId: string) {
  const updated = await db
    .update(orders)
    .set({ status: "failed", paymentStatus: "failed", updatedAt: new Date() })
    .where(
      and(
        eq(orders.id, orderId),
        inArray(orders.paymentStatus, ["pending", "failed"]),
        inArray(orders.status, ["pending", "failed"]),
      ),
    )
    .returning({ id: orders.id });

  // Free the reserved stock (re-reserved if a retry later succeeds)
  if (updated.length > 0) await releaseOrderStock(orderId);
  return updated;
}

// Amount in paise as charged by Razorpay for this order
export const orderAmountInPaise = (order: Pick<Order, "totalAmount">) =>
  Math.round(Number(order.totalAmount) * 100);
