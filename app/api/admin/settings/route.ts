import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { checkoutSettingsSchema } from "@/lib/settings/checkout-settings";
import {
  getCheckoutSettings,
  saveCheckoutSettings,
} from "@/lib/settings/checkout-settings.server";

// GET /api/admin/settings — current checkout settings
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const checkout = await getCheckoutSettings();
    return NextResponse.json({ checkout });
  } catch (error) {
    console.error("[ADMIN_SETTINGS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

// PUT /api/admin/settings — { checkout: CheckoutSettings }
export async function PUT(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const body = await request.json().catch(() => null);
    const parsed = checkoutSettingsSchema.safeParse(body?.checkout);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // De-duplicate list entries
    const value = {
      ...parsed.data,
      cod: {
        ...parsed.data.cod,
        allowedPincodePrefixes: [...new Set(parsed.data.cod.allowedPincodePrefixes)],
        blockedPincodePrefixes: [...new Set(parsed.data.cod.blockedPincodePrefixes)],
      },
      express: {
        ...parsed.data.express,
        cities: [...new Set(parsed.data.express.cities)],
      },
    };

    const checkout = await saveCheckoutSettings(value, admin.user.userId);
    return NextResponse.json({ checkout });
  } catch (error) {
    console.error("[ADMIN_SETTINGS_PUT_ERROR]", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
