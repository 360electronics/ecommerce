"use client";

import { useEffect, useState } from "react";
import { X, Percent, IndianRupee } from "lucide-react";

interface CouponModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: any;
  onClose: () => void;
  onSuccess: (coupon: any) => void;
}

type DiscountType = "amount" | "percentage";

export default function CouponModal({
  open,
  mode,
  initialData,
  onClose,
  onSuccess,
}: CouponModalProps) {
  const [discountType, setDiscountType] = useState<DiscountType>("amount");

  const [form, setForm] = useState({
    code: "",
    amount: "",
    percentage: "",
    limit: "",
    minOrderAmount: "",
    expiryDate: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        code: initialData.code ?? "",
        amount: initialData.amount ?? "",
        percentage: initialData.percentage ?? "",
        limit: initialData.limit ?? "",
        minOrderAmount: initialData.minOrderAmount ?? "",
        expiryDate: initialData.expiryDate?.slice(0, 10) ?? "",
      });
      setDiscountType(initialData.percentage ? "percentage" : "amount");
    } else {
      setForm({
        code: "",
        amount: "",
        percentage: "",
        limit: "",
        minOrderAmount: "",
        expiryDate: "",
      });
      setDiscountType("amount");
    }
  }, [mode, initialData]);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);

    const payload = {
      code: form.code,
      limit: form.limit ? Number(form.limit) : null,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      expiryDate: form.expiryDate || null,

      amount:
        discountType === "amount" && form.amount ? Number(form.amount) : null,

      percentage:
        discountType === "percentage" && form.percentage
          ? Number(form.percentage)
          : null,
    };

    const res = await fetch(
      mode === "create"
        ? "/api/admin/coupons/special"
        : `/api/admin/coupons/special/${initialData.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      onSuccess(data.coupon || data.updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Create Coupon" : "Edit Coupon"}
            </h2>
            <p className="text-sm text-gray-500">
              Configure discount rules for this coupon
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Coupon Code */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Coupon Code</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="SAVE50"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Customers will enter this code at checkout
            </p>
          </div>

          {/* Discount Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Discount Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDiscountType("amount")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  discountType === "amount"
                    ? "bg-primary text-white border-primary"
                    : "hover:bg-gray-50"
                }`}
              >
                <IndianRupee size={16} />
                Flat Amount
              </button>

              <button
                onClick={() => setDiscountType("percentage")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  discountType === "percentage"
                    ? "bg-primary text-white border-primary"
                    : "hover:bg-gray-50"
                }`}
              >
                <Percent size={16} />
                Percentage
              </button>
            </div>
          </div>

          {/* Discount Value */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {discountType === "amount"
                ? "Discount Amount (₹)"
                : "Discount Percentage (%)"}
            </label>
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={discountType === "amount" ? "500" : "10"}
              value={discountType === "amount" ? form.amount : form.percentage}
              onChange={(e) =>
                setForm({
                  ...form,
                  [discountType]: e.target.value,
                })
              }
            />
          </div>

          {/* Rules */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Usage Limit</label>
              <input
                type="number"
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="100"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="999"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minOrderAmount: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Expiry Date</label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  expiryDate: e.target.value,
                })
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm cursor-pointer bg-white border hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={submit}
            className="rounded-xl px-6 cursor-pointer py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}
