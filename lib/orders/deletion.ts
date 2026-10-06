// Which orders an admin may permanently delete. Only abandoned online-payment
// attempts (never paid, no payment id) — everything else is a business /
// financial record (paid, COD, refunded, cancelled-after-confirmation) and must
// be cancelled instead so its history, charges and refunds are kept.

export const DELETABLE_STATUSES = ["pending", "failed", "cancelled"] as const;
export const DELETABLE_PAYMENT_STATUSES = ["pending", "failed"] as const;

export interface DeletableOrderFields {
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string | null;
}

export function getOrderDeleteBlocker(order: DeletableOrderFields): string | null {
  if (order.paymentMethod !== "razorpay") {
    return "Cash on Delivery orders can't be deleted. Cancel the order instead.";
  }
  if (order.paymentId || !(DELETABLE_PAYMENT_STATUSES as readonly string[]).includes(order.paymentStatus)) {
    return "Orders with a payment (paid or refunded) can't be deleted. Cancel the order instead.";
  }
  if (!(DELETABLE_STATUSES as readonly string[]).includes(order.status)) {
    return "Only abandoned (unpaid) orders can be deleted. Cancel the order instead.";
  }
  return null;
}

export const isOrderDeletable = (order: DeletableOrderFields) => getOrderDeleteBlocker(order) === null;
