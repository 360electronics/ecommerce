import { NextResponse } from "next/server";
import { getCheckoutSettings } from "@/lib/settings/checkout-settings.server";

// GET /api/settings/checkout — public, read-only checkout config used by the
// cart/checkout pages for display. The order API re-reads it server-side.
export async function GET() {
  const settings = await getCheckoutSettings();
  return NextResponse.json(settings, {
    headers: { "Cache-Control": "no-store" },
  });
}
