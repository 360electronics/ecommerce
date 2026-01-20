import { db } from "@/db/drizzle";
import { checkout, checkoutSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  // 1️⃣ Mark session completed
  await db
    .update(checkoutSessions)
    .set({ status: "converted" })
    .where(eq(checkoutSessions.id, sessionId));

  // 2️⃣ Remove checkout items
  await db
    .delete(checkout)
    .where(eq(checkout.checkoutSessionId, sessionId));

  return NextResponse.json({ success: true });
}
