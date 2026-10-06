import { requireUser } from "@/lib/server-auth";
import { db } from "@/db/drizzle";
import { checkout, checkoutSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  // Only the session owner may complete it
  const [session] = await db
    .select({ userId: checkoutSessions.userId })
    .from(checkoutSessions)
    .where(eq(checkoutSessions.id, sessionId))
    .limit(1);

  if (!session || session.userId !== auth.user.userId) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
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
