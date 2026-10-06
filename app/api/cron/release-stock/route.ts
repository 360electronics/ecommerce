import { NextResponse } from "next/server";
import { releaseStaleReservations, STALE_RESERVATION_MINUTES } from "@/lib/orders/stock";

/*
 * GET /api/cron/release-stock — Vercel Cron (see vercel.json)
 * Releases stock held by online orders left unpaid for more than
 * STALE_RESERVATION_MINUTES (closed tab, dropped connection).
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const released = await releaseStaleReservations();
    console.info("[CRON_RELEASE_STOCK]", { variantsRestocked: released, olderThanMinutes: STALE_RESERVATION_MINUTES });
    return NextResponse.json({ ok: true, variantsRestocked: released });
  } catch (error) {
    console.error("[CRON_RELEASE_STOCK_ERROR]", error);
    return NextResponse.json({ error: "Failed to release stock" }, { status: 500 });
  }
}
