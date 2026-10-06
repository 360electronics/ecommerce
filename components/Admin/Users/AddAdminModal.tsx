"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ShieldPlus } from "lucide-react";
import { showFancyToast } from "@/components/Reusable/ShowCustomToast";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export function AddAdminModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !isSaving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, isSaving]);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create admin");

      showFancyToast({
        title: "Admin created",
        message: `${data.firstName} can now sign in with OTP using ${data.email}.`,
        type: "success",
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !isSaving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Add admin user"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Add admin user</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-700">First name *</span>
              <input required className={inputClass} value={form.firstName} onChange={update("firstName")} autoFocus />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-700">Last name</span>
              <input className={inputClass} value={form.lastName} onChange={update("lastName")} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-gray-700">Email *</span>
            <input
              required
              type="email"
              className={inputClass}
              value={form.email}
              onChange={update("email")}
              placeholder="name@360electronics.in"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-gray-700">Mobile number</span>
            <input
              type="tel"
              inputMode="numeric"
              className={inputClass}
              value={form.phoneNumber}
              onChange={update("phoneNumber")}
              placeholder="10-digit mobile number"
            />
          </label>

          <p className="rounded-md bg-blue-50 p-3 text-xs text-blue-800">
            The new admin signs in on the normal sign-in page with an OTP sent to this email
            (or mobile). There is no password. Their email/phone is verified on first sign-in.
          </p>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create admin
          </button>
        </div>
      </form>
    </div>
  );
}
