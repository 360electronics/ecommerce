// Cancellation rules — pure, shared by the cancel API, the customer preview and
// the admin preview so the numbers shown always match what gets recorded.
import type { CheckoutSettings } from "@/lib/settings/checkout-settings";
import { roundCurrency } from "@/lib/checkout/pricing";

export type CancelInitiator = "customer" | "store";

export interface CancellableOrder {
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: string | number;
}

export interface CancellationQuote {
  allowed: boolean;
  /** Why it can't be cancelled (when allowed = false) */
  reason?: string;
  stage: "before_shipping" | "after_shipping";
  /** Money actually received online — 0 for COD / unpaid orders */
  paidAmount: number;
  chargePercent: number;
  charge: number;
  refundAmount: number;
  refundStatus: "not_applicable" | "pending";
}

const BEFORE_SHIPPING = ["pending", "confirmed"];
const AFTER_SHIPPING = ["shipped", "delivered", "returned"];

export function quoteCancellation(
  order: CancellableOrder,
  initiatedBy: CancelInitiator,
  rules: CheckoutSettings["cancellation"],
): CancellationQuote {
  const stage = AFTER_SHIPPING.includes(order.status) ? "after_shipping" : "before_shipping";
  const isPaidOnline = order.paymentMethod === "razorpay" && order.paymentStatus === "paid";
  const paidAmount = isPaidOnline ? roundCurrency(Number(order.totalAmount) || 0) : 0;

  const base = {
    stage,
    paidAmount,
    chargePercent: 0,
    charge: 0,
    refundAmount: paidAmount,
    refundStatus: paidAmount > 0 ? ("pending" as const) : ("not_applicable" as const),
  } satisfies Omit<CancellationQuote, "allowed">;

  if (order.status === "cancelled") {
    return { ...base, allowed: false, reason: "Order is already cancelled" };
  }
  if (!BEFORE_SHIPPING.includes(order.status) && !AFTER_SHIPPING.includes(order.status)) {
    return { ...base, allowed: false, reason: "This order can't be cancelled" };
  }

  if (initiatedBy === "customer") {
    if (!rules.customerCanCancel) {
      return { ...base, allowed: false, reason: "Online cancellation is turned off. Please contact support." };
    }
    // Customers only cancel confirmed orders (unpaid "pending" ones are abandoned checkouts)
    if (order.status === "pending" || order.status === "delivered" || order.status === "returned") {
      return {
        ...base,
        allowed: false,
        reason:
          order.status === "pending"
            ? "This order hasn't been confirmed yet"
            : "Delivered orders can't be cancelled. Please raise a return request.",
      };
    }
    if (stage === "after_shipping" && !rules.customerCanCancelAfterShipping) {
      return { ...base, allowed: false, reason: "This order has shipped. Please contact support to cancel." };
    }
  }

  // Charge only when the buyer cancels a prepaid order; store cancels refund in full
  const chargePercent =
    initiatedBy === "customer" && paidAmount > 0
      ? stage === "after_shipping"
        ? rules.afterShippingChargePercent
        : rules.beforeShippingChargePercent
      : 0;
  const charge = roundCurrency((paidAmount * chargePercent) / 100);
  const refundAmount = roundCurrency(paidAmount - charge);

  return {
    ...base,
    allowed: true,
    chargePercent,
    charge,
    refundAmount,
    refundStatus: refundAmount > 0 ? "pending" : "not_applicable",
  };
}
