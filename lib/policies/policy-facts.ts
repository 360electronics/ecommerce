// Policy wording built from live Admin → Settings, so the published policies
// always match what checkout and the order system actually enforce.
import {
  DEFAULT_CHECKOUT_SETTINGS,
  type CheckoutSettings,
} from "@/lib/settings/checkout-settings";
import { getCheckoutSettings } from "@/lib/settings/checkout-settings.server";

export const POLICY_LAST_UPDATED = "Oct 06, 2026";

export const BUSINESS = {
  name: "360 Electronics",
  aka: "Computer Garage 360",
  proprietor: "NOOR MOHAMED MOHAMED USSAN",
  address: "173-178, Chinnaswamy Road, New Siddhapudur, Coimbatore, Tamil Nadu 641044, India",
  phone: "+91 7558132543",
  email: "360electronicsofficial@gmail.com",
  hours: "Monday to Saturday, 9:00 AM to 7:00 PM IST",
} as const;

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const titleCase = (value: string) =>
  value.replace(/\b\w/g, (c) => c.toUpperCase());

const listJoin = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

const TAMIL_NADU_PREFIXES = ["60", "61", "62", "63", "64"];

function describeCodRegion(prefixes: string[]) {
  if (prefixes.length === 0) return "all serviceable PIN codes in India";
  const sorted = [...prefixes].sort();
  if (sorted.join() === TAMIL_NADU_PREFIXES.join()) {
    return "delivery addresses in Tamil Nadu (PIN codes starting with 60–64)";
  }
  return `delivery PIN codes starting with ${listJoin(sorted)}`;
}

export interface PolicyFacts {
  settings: CheckoutSettings;
  cod: {
    enabled: boolean;
    maxAmount: string;
    region: string;
    hasExclusions: boolean;
  };
  shipping: {
    ratePerItem: string;
    freeAbove: string;
    days: number;
  };
  express: {
    enabled: boolean;
    ratePerItem: string;
    days: number;
    cities: string;
  };
  cancellation: CheckoutSettings["cancellation"];
}

export function buildPolicyFacts(settings: CheckoutSettings): PolicyFacts {
  return {
    settings,
    cod: {
      enabled: settings.cod.enabled,
      maxAmount: inr(settings.cod.maxOrderAmount),
      region: describeCodRegion(settings.cod.allowedPincodePrefixes),
      hasExclusions: settings.cod.blockedPincodePrefixes.length > 0,
    },
    shipping: {
      ratePerItem: inr(settings.shipping.standardRatePerItem),
      freeAbove: inr(settings.shipping.freeShippingThreshold),
      days: settings.shipping.standardDeliveryDays,
    },
    express: {
      enabled: settings.express.enabled && settings.express.cities.length > 0,
      ratePerItem: inr(settings.express.ratePerItem),
      days: settings.express.deliveryDays,
      cities: listJoin(settings.express.cities.map(titleCase)),
    },
    cancellation: settings.cancellation,
  };
}

export async function getPolicyFacts(): Promise<PolicyFacts> {
  try {
    return buildPolicyFacts(await getCheckoutSettings());
  } catch {
    return buildPolicyFacts(DEFAULT_CHECKOUT_SETTINGS);
  }
}
