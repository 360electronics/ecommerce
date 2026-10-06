// Human-readable payment labels for order pages, invoices and admin views.

const METHOD_LABELS: Record<string, string> = {
  razorpay: "Online payment",
  cod: "Cash on Delivery",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  cod: "Pay on delivery",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export const paymentMethodLabel = (method: string | null | undefined) =>
  (method && METHOD_LABELS[method]) || "—";

export const paymentStatusLabel = (status: string | null | undefined) =>
  (status && STATUS_LABELS[status]) || "—";

// One-line summary, e.g. "Paid online", "Cash on Delivery", "Refunded (online payment)"
export function paymentSummary(method: string | null | undefined, status: string | null | undefined) {
  if (method === "cod") {
    return status === "cancelled" ? "Cash on Delivery (cancelled)" : "Cash on Delivery";
  }
  switch (status) {
    case "paid":
      return "Paid online";
    case "refunded":
      return "Refunded (online payment)";
    case "failed":
      return "Online payment failed";
    case "cancelled":
      return "Online payment cancelled";
    default:
      return "Online payment pending";
  }
}
