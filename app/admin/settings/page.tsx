"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { showFancyToast } from "@/components/Reusable/ShowCustomToast";
import {
  DEFAULT_CHECKOUT_SETTINGS,
  type CheckoutSettings,
} from "@/lib/settings/checkout-settings";

// List fields are edited as comma / newline separated text
type FormState = Omit<CheckoutSettings, "cod" | "express"> & {
  cod: Omit<CheckoutSettings["cod"], "allowedPincodePrefixes" | "blockedPincodePrefixes"> & {
    allowedPincodePrefixes: string;
    blockedPincodePrefixes: string;
  };
  express: Omit<CheckoutSettings["express"], "cities"> & { cities: string };
};

const joinList = (items: string[]) => items.join(", ");
const splitList = (text: string) =>
  text
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);

const toForm = (s: CheckoutSettings): FormState => ({
  ...s,
  cod: {
    ...s.cod,
    allowedPincodePrefixes: joinList(s.cod.allowedPincodePrefixes),
    blockedPincodePrefixes: joinList(s.cod.blockedPincodePrefixes),
  },
  express: { ...s.express, cities: joinList(s.express.cities) },
});

const fromForm = (f: FormState): CheckoutSettings => ({
  cod: {
    enabled: f.cod.enabled,
    maxOrderAmount: Number(f.cod.maxOrderAmount),
    allowedPincodePrefixes: splitList(f.cod.allowedPincodePrefixes),
    blockedPincodePrefixes: splitList(f.cod.blockedPincodePrefixes),
  },
  shipping: {
    standardRatePerItem: Number(f.shipping.standardRatePerItem),
    freeShippingThreshold: Number(f.shipping.freeShippingThreshold),
    standardDeliveryDays: Number(f.shipping.standardDeliveryDays),
  },
  express: {
    enabled: f.express.enabled,
    ratePerItem: Number(f.express.ratePerItem),
    deliveryDays: Number(f.express.deliveryDays),
    cities: splitList(f.express.cities).map((c) => c.toLowerCase()),
  },
  checkout: {
    sessionTimeoutMinutes: Number(f.checkout.sessionTimeoutMinutes),
  },
  cancellation: {
    customerCanCancel: f.cancellation.customerCanCancel,
    customerCanCancelAfterShipping: f.cancellation.customerCanCancelAfterShipping,
    beforeShippingChargePercent: Number(f.cancellation.beforeShippingChargePercent),
    afterShippingChargePercent: Number(f.cancellation.afterShippingChargePercent),
  },
});

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mb-5">{description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 md:col-span-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

export default function AdminSettingsPage() {
  const [form, setForm] = useState<FormState>(toForm(DEFAULT_CHECKOUT_SETTINGS));
  const [saved, setSaved] = useState<FormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
        const data = await res.json();
        const next = toForm(data.checkout);
        setForm(next);
        setSaved(next);
      } catch (error: any) {
        showFancyToast({
          title: "Failed to load settings",
          message: error?.message || "Please refresh the page.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const update = <K extends keyof FormState>(
    section: K,
    patch: Partial<FormState[K]>,
  ) => setForm((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));

  const isDirty = saved !== null && JSON.stringify(form) !== JSON.stringify(saved);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout: fromForm(form) }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fieldErrors = data?.issues?.fieldErrors ?? {};
        const messages = [
          ...(data?.issues?.formErrors ?? []),
          ...Object.entries(fieldErrors).flatMap(([field, msgs]) =>
            (msgs as string[]).map((m) => `${field}: ${m}`),
          ),
        ];
        setErrors(messages.length ? messages : [data.error || "Failed to save settings"]);
        throw new Error(data.error || "Failed to save settings");
      }

      const next = toForm(data.checkout);
      setForm(next);
      setSaved(next);
      showFancyToast({
        title: "Settings saved",
        message: "Checkout settings are live for new orders.",
        type: "success",
      });
    } catch (error: any) {
      showFancyToast({
        title: "Could not save settings",
        message: error?.message || "Please check the values and try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading settings…
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Settings</h1>
          <p className="text-sm text-gray-500">
            Checkout, delivery and payment rules. Changes apply to new orders immediately.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={() => saved && setForm(saved)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Discard
          </button>
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <Section
        title="Cash on Delivery"
        description="Who can choose COD at checkout. Enforced on the server when the order is placed."
      >
        <Toggle
          label="Enable Cash on Delivery"
          checked={form.cod.enabled}
          onChange={(enabled) => update("cod", { enabled })}
        />
        <Field
          label="Maximum order amount (₹)"
          hint="COD is allowed only when the order total is below this amount."
        >
          <input
            type="number"
            min={1}
            step="1"
            className={inputClass}
            value={form.cod.maxOrderAmount}
            onChange={(e) => update("cod", { maxOrderAmount: e.target.value as any })}
          />
        </Field>
        <div />
        <Field
          label="Allowed pincode prefixes"
          hint="Comma separated. A pincode must start with one of these. Leave empty to allow all pincodes. Tamil Nadu: 60, 61, 62, 63, 64."
          wide
        >
          <textarea
            rows={2}
            className={inputClass}
            value={form.cod.allowedPincodePrefixes}
            onChange={(e) => update("cod", { allowedPincodePrefixes: e.target.value })}
          />
        </Field>
        <Field
          label="Blocked pincodes / prefixes"
          hint="Comma separated. Always excluded, even if allowed above — e.g. full 6-digit Puducherry pincodes such as 605001."
          wide
        >
          <textarea
            rows={2}
            className={inputClass}
            value={form.cod.blockedPincodePrefixes}
            onChange={(e) => update("cod", { blockedPincodePrefixes: e.target.value })}
          />
        </Field>
      </Section>

      <Section
        title="Standard Delivery"
        description="Shipping charges and delivery estimate for standard delivery."
      >
        <Field label="Shipping charge per item (₹)">
          <input
            type="number"
            min={0}
            step="1"
            className={inputClass}
            value={form.shipping.standardRatePerItem}
            onChange={(e) =>
              update("shipping", { standardRatePerItem: e.target.value as any })
            }
          />
        </Field>
        <Field
          label="Free shipping above (₹)"
          hint="Standard delivery is free when the cart subtotal is above this."
        >
          <input
            type="number"
            min={0}
            step="1"
            className={inputClass}
            value={form.shipping.freeShippingThreshold}
            onChange={(e) =>
              update("shipping", { freeShippingThreshold: e.target.value as any })
            }
          />
        </Field>
        <Field label="Estimated delivery (days)">
          <input
            type="number"
            min={1}
            max={60}
            step="1"
            className={inputClass}
            value={form.shipping.standardDeliveryDays}
            onChange={(e) =>
              update("shipping", { standardDeliveryDays: e.target.value as any })
            }
          />
        </Field>
      </Section>

      <Section
        title="Express Delivery"
        description="Offered only when every product in the order supports express delivery and the address is in one of the listed cities."
      >
        <Toggle
          label="Enable Express Delivery"
          checked={form.express.enabled}
          onChange={(enabled) => update("express", { enabled })}
        />
        <Field label="Shipping charge per item (₹)">
          <input
            type="number"
            min={0}
            step="1"
            className={inputClass}
            value={form.express.ratePerItem}
            onChange={(e) => update("express", { ratePerItem: e.target.value as any })}
          />
        </Field>
        <Field label="Estimated delivery (days)">
          <input
            type="number"
            min={1}
            max={60}
            step="1"
            className={inputClass}
            value={form.express.deliveryDays}
            onChange={(e) => update("express", { deliveryDays: e.target.value as any })}
          />
        </Field>
        <Field
          label="Express cities"
          hint="Comma separated district names as returned by the India Post pincode lookup (e.g. coimbatore, chennai)."
          wide
        >
          <textarea
            rows={2}
            className={inputClass}
            value={form.express.cities}
            onChange={(e) => update("express", { cities: e.target.value })}
          />
        </Field>
      </Section>

      <Section
        title="Cancellation & Refunds"
        description="Charge kept when a customer cancels a prepaid (Razorpay) order. COD orders and cancellations made by the store are never charged — the full amount is refunded."
      >
        <Toggle
          label="Customers can cancel orders from their account"
          checked={form.cancellation.customerCanCancel}
          onChange={(customerCanCancel) => update("cancellation", { customerCanCancel })}
        />
        <Toggle
          label="Allow customer cancellation after the order has shipped"
          checked={form.cancellation.customerCanCancelAfterShipping}
          onChange={(customerCanCancelAfterShipping) =>
            update("cancellation", { customerCanCancelAfterShipping })
          }
        />
        <Field
          label="Charge before shipping (%)"
          hint="Kept from the refund when the customer cancels a paid order before it ships. Policy: 2%."
        >
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            className={inputClass}
            value={form.cancellation.beforeShippingChargePercent}
            onChange={(e) =>
              update("cancellation", { beforeShippingChargePercent: e.target.value as any })
            }
          />
        </Field>
        <Field
          label="Charge after shipping (%)"
          hint="Kept from the refund when the customer cancels a paid order after it has shipped. Policy: 5%."
        >
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            className={inputClass}
            value={form.cancellation.afterShippingChargePercent}
            onChange={(e) =>
              update("cancellation", { afterShippingChargePercent: e.target.value as any })
            }
          />
        </Field>
        <p className="md:col-span-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
          Refunds are not sent automatically. After a paid order is cancelled, open it in
          Admin → Orders and click <strong>Refund via Razorpay</strong>. The Cancellation Policy
          and Terms pages show these values automatically (updated within 5 minutes).
        </p>
      </Section>

      <Section
        title="Checkout"
        description="Checkout session behaviour."
      >
        <Field
          label="Checkout session timeout (minutes)"
          hint="How long a customer has to complete checkout (5–120)."
        >
          <input
            type="number"
            min={5}
            max={120}
            step="1"
            className={inputClass}
            value={form.checkout.sessionTimeoutMinutes}
            onChange={(e) =>
              update("checkout", { sessionTimeoutMinutes: e.target.value as any })
            }
          />
        </Field>
      </Section>
    </form>
  );
}
