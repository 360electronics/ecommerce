import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { storeSettings } from "@/db/schema";
import {
  resolveCheckoutSettings,
  type CheckoutSettings,
} from "./checkout-settings";

const CHECKOUT_SETTINGS_KEY = "checkout";

// Read fresh on every call so admin changes apply immediately on all instances.
export async function getCheckoutSettings(): Promise<CheckoutSettings> {
  try {
    const [row] = await db
      .select({ value: storeSettings.value })
      .from(storeSettings)
      .where(eq(storeSettings.key, CHECKOUT_SETTINGS_KEY))
      .limit(1);

    return resolveCheckoutSettings(row?.value);
  } catch (error) {
    // e.g. table not migrated yet — keep checkout working on defaults
    console.error("[CHECKOUT_SETTINGS_READ_ERROR]", error);
    return resolveCheckoutSettings(undefined);
  }
}

export async function saveCheckoutSettings(
  settings: CheckoutSettings,
  adminUserId: string,
): Promise<CheckoutSettings> {
  const now = new Date();
  await db
    .insert(storeSettings)
    .values({
      key: CHECKOUT_SETTINGS_KEY,
      value: settings,
      updatedBy: adminUserId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: storeSettings.key,
      set: { value: settings, updatedBy: adminUserId, updatedAt: now },
    });

  return settings;
}
