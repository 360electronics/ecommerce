import { z } from "zod";

// Admin-configurable checkout settings (Admin → Settings).
// Pure module: safe to import from client components and API routes.
// Defaults reproduce the values that used to be hardcoded.

const pincodePrefix = z
  .string()
  .trim()
  .regex(/^\d{1,6}$/, "Pincode prefixes must be 1–6 digits");

const money = z.coerce.number().min(0).max(10_000_000);

export const checkoutSettingsSchema = z.object({
  cod: z.object({
    enabled: z.boolean(),
    // COD allowed only when order total is strictly below this (₹)
    maxOrderAmount: money.refine((v) => v > 0, "Must be greater than 0"),
    // Pincode must start with one of these (empty list = all pincodes)
    allowedPincodePrefixes: z.array(pincodePrefix).max(500),
    // Pincodes / prefixes always excluded, checked before the allow list
    blockedPincodePrefixes: z.array(pincodePrefix).max(500),
  }),
  shipping: z.object({
    standardRatePerItem: money,
    // Standard delivery is free when subtotal is above this (₹)
    freeShippingThreshold: money,
    standardDeliveryDays: z.coerce.number().int().min(1).max(60),
  }),
  express: z.object({
    enabled: z.boolean(),
    ratePerItem: money,
    deliveryDays: z.coerce.number().int().min(1).max(60),
    // Districts (from pincode lookup), compared case-insensitively
    cities: z
      .array(z.string().trim().toLowerCase().min(1).max(100))
      .max(200),
  }),
  checkout: z.object({
    sessionTimeoutMinutes: z.coerce.number().int().min(5).max(120),
  }),
});

export type CheckoutSettings = z.infer<typeof checkoutSettingsSchema>;

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  cod: {
    enabled: true,
    maxOrderAmount: 50000,
    // Tamil Nadu postal circle: 600000 – 643999
    allowedPincodePrefixes: ["60", "61", "62", "63", "64"],
    blockedPincodePrefixes: [],
  },
  shipping: {
    standardRatePerItem: 50,
    freeShippingThreshold: 500,
    standardDeliveryDays: 7,
  },
  express: {
    enabled: true,
    ratePerItem: 79,
    deliveryDays: 1,
    cities: ["coimbatore", "chennai", "erode", "madurai"],
  },
  checkout: {
    sessionTimeoutMinutes: 15,
  },
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : override) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = key in base ? deepMerge((base as Record<string, unknown>)[key], value) : value;
  }
  return out as T;
}

// Fill missing keys (e.g. settings saved before a new field existed) with
// defaults, then validate. Falls back to defaults on invalid stored data.
export function resolveCheckoutSettings(stored: unknown): CheckoutSettings {
  const parsed = checkoutSettingsSchema.safeParse(
    deepMerge(DEFAULT_CHECKOUT_SETTINGS, stored ?? {}),
  );
  if (!parsed.success) {
    console.error("[CHECKOUT_SETTINGS_INVALID]", parsed.error.flatten());
    return DEFAULT_CHECKOUT_SETTINGS;
  }
  return parsed.data;
}
