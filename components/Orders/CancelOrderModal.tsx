"use client";

import { useEffect, useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";

type Initiator = "customer" | "store";

interface Quote {
  allowed: boolean;
  reason?: string;
  stage: "before_shipping" | "after_shipping";
  paidAmount: number;
  chargePercent: number;
  charge: number;
  refundAmount: number;
  refundStatus: "not_applicable" | "pending";
}

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

/**
 * Cancel-order confirmation. Shows the server-computed charge/refund before
 * confirming. mode="admin" lets staff pick who initiated the cancellation.
 */
export function CancelOrderModal({
  orderId,
  mode,
  onClose,
  onCancelled,
}: {
  orderId: string;
  mode: "customer" | "admin";
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [initiatedBy, setInitiatedBy] = useState<Initiator>(mode === "admin" ? "store" : "customer");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [reason, setReason] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // (Re)load the preview whenever the initiator changes
  useEffect(() => {
    let active = true;
    setLoadingQuote(true);
    setError(null);
    fetch(`/api/orders/${orderId}/cancel?by=${initiatedBy}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load cancellation details");
        if (active) setQuote(data);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingQuote(false));
    return () => {
      active = false;
    };
  }, [orderId, initiatedBy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim() || undefined,
          ...(mode === "admin" ? { cancelledBy: initiatedBy } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to cancel order");
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Cancel order"
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Cancel order</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          {mode === "admin" && (
            <fieldset className="space-y-2">
              <legend className="mb-1 font-medium text-gray-700">Who is cancelling?</legend>
              {(
                [
                  ["store", "Cancelled by store", "Full refund, no charge"],
                  ["customer", "Customer requested", "Cancellation charge applies"],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                    initiatedBy === value ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="initiatedBy"
                    value={value}
                    checked={initiatedBy === value}
                    onChange={() => setInitiatedBy(value)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium text-gray-900">{label}</span>
                    <span className="text-xs text-gray-500">{hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {loadingQuote ? (
            <div className="flex items-center justify-center py-6 text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating…
            </div>
          ) : quote && !quote.allowed ? (
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {quote.reason}
            </div>
          ) : quote ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              {quote.paidAmount > 0 ? (
                <dl className="space-y-1.5">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Amount paid</dt>
                    <dd className="font-medium">{inr(quote.paidAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">
                      Cancellation charge ({quote.chargePercent}%
                      {quote.chargePercent > 0 &&
                        `, ${quote.stage === "after_shipping" ? "after" : "before"} shipping`}
                      )
                    </dt>
                    <dd className="font-medium text-red-600">− {inr(quote.charge)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1.5 text-base">
                    <dt className="font-semibold text-gray-900">Refund</dt>
                    <dd className="font-semibold text-green-700">{inr(quote.refundAmount)}</dd>
                  </div>
                  <p className="pt-1 text-xs text-gray-500">
                    {mode === "customer"
                      ? "Refunds go back to your original payment method and usually take 7–10 working days."
                      : "Refund is recorded as pending — send it with “Refund via Razorpay” on the order page."}
                  </p>
                </dl>
              ) : (
                <p className="text-gray-700">
                  No payment was taken for this order, so there is no charge and nothing to refund.
                </p>
              )}
            </div>
          ) : null}

          {quote?.allowed && (
            <label className="flex flex-col gap-1.5">
              <span className="font-medium text-gray-700">Reason (optional)</span>
              <textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={mode === "customer" ? "Tell us why you're cancelling" : "Internal note / reason"}
              />
            </label>
          )}

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Keep order
          </button>
          <button
            onClick={handleConfirm}
            disabled={!quote?.allowed || loadingQuote || submitting}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Cancel order
          </button>
        </div>
      </div>
    </div>
  );
}
