// Shared checkout pricing + payment rules.
// Pure functions only — imported by both the checkout page (display) and the
// order API (source of truth), so the two can never drift apart.
// Rates / limits come from admin settings (see lib/settings/checkout-settings).

import type { CheckoutSettings } from "@/lib/settings/checkout-settings";

export type DeliveryMode = "standard" | "express";
export type PaymentMethod = "razorpay" | "cod";

export interface PricingLine {
  ourPrice: number;
  mrp: number;
  quantity: number;
  // Price of the bundled cart-offer product, 0 when the line has none
  offerPrice: number;
  hasOffer: boolean;
}

export interface PricingCoupon {
  type: "amount" | "percentage";
  value: number;
}

export interface CheckoutTotals {
  subtotal: number;
  regularProductsSubtotal: number;
  offerProductsTotal: number;
  savings: number;
  discountAmount: number;
  shippingAmount: number;
  grandTotal: number;
}

export const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

// Lines carrying an offer product are always quantity 1
export const effectiveQuantity = (line: Pick<PricingLine, "quantity" | "hasOffer">) =>
  line.hasOffer ? 1 : line.quantity;

export function calculateCheckoutTotals(
  lines: PricingLine[],
  deliveryMode: DeliveryMode,
  coupon: PricingCoupon | null,
  settings: Pick<CheckoutSettings, "shipping" | "express">,
): CheckoutTotals {
  const regularProductsSubtotal = lines.reduce(
    (sum, line) => sum + line.ourPrice * effectiveQuantity(line),
    0,
  );

  const offerProductsTotal = lines.reduce(
    (sum, line) => (line.hasOffer ? sum + line.offerPrice : sum),
    0,
  );

  const subtotal = regularProductsSubtotal + offerProductsTotal;

  // No savings shown on offer lines
  const savings = lines.reduce((sum, line) => {
    if (line.hasOffer) return sum;
    const mrp = line.mrp || line.ourPrice;
    return sum + (mrp - line.ourPrice) * effectiveQuantity(line);
  }, 0);

  const rawDiscount = coupon
    ? coupon.type === "amount"
      ? coupon.value || 0
      : (subtotal * (coupon.value || 0)) / 100
    : 0;
  const discountAmount = Math.min(Math.max(0, rawDiscount), subtotal);

  const ratePerItem =
    deliveryMode === "express"
      ? settings.express.ratePerItem
      : settings.shipping.standardRatePerItem;

  const shippingAmount =
    subtotal > settings.shipping.freeShippingThreshold && deliveryMode === "standard"
      ? 0
      : lines.reduce((sum, line) => sum + ratePerItem * effectiveQuantity(line), 0);

  const grandTotal = subtotal - discountAmount + shippingAmount;

  return {
    subtotal: roundCurrency(subtotal),
    regularProductsSubtotal: roundCurrency(regularProductsSubtotal),
    offerProductsTotal: roundCurrency(offerProductsTotal),
    savings: roundCurrency(savings),
    discountAmount: roundCurrency(discountAmount),
    shippingAmount: roundCurrency(shippingAmount),
    grandTotal: roundCurrency(grandTotal),
  };
}

const normalizePincode = (postalCode: string | null | undefined) =>
  (postalCode ?? "").replace(/\s+/g, "");

// Pincode passes the admin's COD allow/block prefix lists
export function isPincodeEligibleForCod(
  postalCode: string | null | undefined,
  cod: CheckoutSettings["cod"],
) {
  const pin = normalizePincode(postalCode);
  if (!/^\d{6}$/.test(pin)) return false;
  if (cod.blockedPincodePrefixes.some((prefix) => pin.startsWith(prefix))) return false;
  if (cod.allowedPincodePrefixes.length === 0) return true;
  return cod.allowedPincodePrefixes.some((prefix) => pin.startsWith(prefix));
}

export type CodIneligibleReason = "DISABLED" | "AMOUNT_LIMIT" | "REGION" | null;

export function getCodEligibility(
  grandTotal: number,
  postalCode: string | null | undefined,
  cod: CheckoutSettings["cod"],
): { eligible: boolean; reason: CodIneligibleReason } {
  if (!cod.enabled) return { eligible: false, reason: "DISABLED" };
  if (!isPincodeEligibleForCod(postalCode, cod)) return { eligible: false, reason: "REGION" };
  if (grandTotal >= cod.maxOrderAmount) return { eligible: false, reason: "AMOUNT_LIMIT" };
  return { eligible: true, reason: null };
}

// Express needs: feature on, every product express-eligible and the delivery
// district in the admin's list. The district comes from a client-side pincode
// lookup, so the server passes skipCityCheck and validates the rest.
export function isExpressDeliveryAvailable(
  productDeliveryModes: (string | null | undefined)[],
  city: string | null | undefined,
  express: CheckoutSettings["express"],
  options: { skipCityCheck?: boolean } = {},
) {
  if (!express.enabled || productDeliveryModes.length === 0) return false;
  if (!productDeliveryModes.every((mode) => mode === "express")) return false;
  if (options.skipCityCheck) return true;
  return !!city && express.cities.includes(city.toLowerCase().trim());
}

export function codIneligibleMessage(
  reason: CodIneligibleReason,
  cod: Pick<CheckoutSettings["cod"], "maxOrderAmount">,
) {
  switch (reason) {
    case "DISABLED":
      return "Cash on Delivery is currently unavailable";
    case "REGION":
      return "COD is not available for the selected address";
    case "AMOUNT_LIMIT":
      return `COD available only for orders below ₹${cod.maxOrderAmount.toLocaleString("en-IN")}`;
    default:
      return "";
  }
}
