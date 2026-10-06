"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

export interface OrderCancellation {
  cancelledBy: "customer" | "store" | null;
  reason: string | null;
  cancelledAt: string | null;
  chargePercent: number;
  charge: number;
  refundAmount: number;
  refundStatus: "not_applicable" | "pending" | "processing" | "processed" | "failed" | null;
  refundId: string | null;
  refundedAt: string | null;
}

// Map the raw orders row (from /api/orders/[id]) to the summary shape
export function toOrderCancellation(order: any): OrderCancellation | null {
  if (order?.status !== "cancelled") return null;
  return {
    cancelledBy: order.cancelledBy ?? null,
    reason: order.cancellationReason ?? null,
    cancelledAt: order.cancelledAt ?? null,
    chargePercent: Number(order.cancellationChargePercent ?? 0),
    charge: Number(order.cancellationCharge ?? 0),
    refundAmount: Number(order.refundAmount ?? 0),
    refundStatus: order.refundStatus ?? null,
    refundId: order.refundId ?? null,
    refundedAt: order.refundedAt ?? null,
  };
}

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "—";

const REFUND_LABELS: Record<string, { label: string; tone: string }> = {
  not_applicable: { label: "No refund due", tone: "bg-gray-100 text-gray-700" },
  pending: { label: "Refund pending", tone: "bg-amber-100 text-amber-800" },
  processing: { label: "Refund processing", tone: "bg-blue-100 text-blue-800" },
  processed: { label: "Refunded", tone: "bg-green-100 text-green-800" },
  failed: { label: "Refund failed", tone: "bg-red-100 text-red-800" },
};

export function CancellationSummary({
  orderId,
  cancellation,
  mode,
  onRefunded,
}: {
  orderId: string;
  cancellation: OrderCancellation;
  mode: "customer" | "admin";
  onRefunded?: () => void;
}) {
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = cancellation.refundStatus ?? "not_applicable";
  const badge = REFUND_LABELS[status] ?? REFUND_LABELS.not_applicable;
  const canRefund = mode === "admin" && (status === "pending" || status === "failed") && cancellation.refundAmount > 0;

  const handleRefund = async () => {
    if (!window.confirm(`Send a refund of ${inr(cancellation.refundAmount)} via Razorpay?`)) return;
    setRefunding(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Refund failed");
      onRefunded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 text-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">Cancellation</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.tone}`}>{badge.label}</span>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        <div className="flex justify-between gap-3">
          <dt className="text-gray-600">Cancelled by</dt>
          <dd className="font-medium capitalize">
            {cancellation.cancelledBy === "store" ? "Store" : cancellation.cancelledBy === "customer" ? "Customer" : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-600">Cancelled on</dt>
          <dd className="font-medium">{formatDate(cancellation.cancelledAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-600">Cancellation charge</dt>
          <dd className="font-medium">
            {inr(cancellation.charge)}
            {cancellation.chargePercent > 0 && ` (${cancellation.chargePercent}%)`}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-600">Refund amount</dt>
          <dd className="font-semibold text-green-700">{inr(cancellation.refundAmount)}</dd>
        </div>
        {cancellation.refundedAt && (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-600">Refunded on</dt>
            <dd className="font-medium">{formatDate(cancellation.refundedAt)}</dd>
          </div>
        )}
        {mode === "admin" && cancellation.refundId && (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-600">Razorpay refund</dt>
            <dd className="font-mono text-xs">{cancellation.refundId}</dd>
          </div>
        )}
      </dl>

      {cancellation.reason && (
        <p className="mt-3 text-gray-700">
          <span className="text-gray-500">Reason: </span>
          {cancellation.reason}
        </p>
      )}

      {mode === "customer" && (status === "pending" || status === "processing") && (
        <p className="mt-3 text-xs text-gray-600">
          Your refund will be sent to the original payment method. It usually takes 7–10 working days to reflect.
        </p>
      )}

      {canRefund && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefund}
            disabled={refunding}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 cursor-pointer"
          >
            {refunding ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            {status === "failed" ? "Retry refund via Razorpay" : "Refund via Razorpay"}
          </button>
          <span className="text-xs text-gray-500">Sends {inr(cancellation.refundAmount)} to the customer.</span>
        </div>
      )}
      {error && <p className="mt-3 rounded-md border border-red-200 bg-white p-2 text-red-700">{error}</p>}
    </div>
  );
}
