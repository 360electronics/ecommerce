import { db } from "@/db/drizzle";
import { checkout, checkoutSessions } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/* -----------------------------------------
   GET → FETCH ONLY 
------------------------------------------ */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(
      and(
        eq(checkoutSessions.userId, userId),
        eq(checkoutSessions.status, "active"),
      ),
    )
    .limit(1);

  return NextResponse.json(session ?? null);
}

/* -----------------------------------------
   POST → EXPLICIT CREATION ONLY
------------------------------------------ */
export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Clean expired first
  await db
    .update(checkoutSessions)
    .set({ status: "expired" })
    .where(
      and(
        eq(checkoutSessions.userId, userId),
        eq(checkoutSessions.status, "active"),
        lt(checkoutSessions.expiresAt, new Date()),
      ),
    );

  // Reuse active session if exists
  // Reuse ONLY active session
  const [existing] = await db
    .select()
    .from(checkoutSessions)
    .where(
      and(
        eq(checkoutSessions.userId, userId),
        eq(checkoutSessions.status, "active"),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(existing);
  }

  // 🔥 Create ONLY when explicitly requested
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const [created] = await db
    .insert(checkoutSessions)
    .values({ userId, expiresAt })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

/* -----------------------------------------
   DELETE → MANUAL CANCEL
------------------------------------------ */
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(
      and(
        eq(checkoutSessions.userId, userId),
        eq(checkoutSessions.status, "active"),
      ),
    )
    .limit(1);

  if (!session) {
    return NextResponse.json({ message: "No active session" });
  }

  // 1️⃣ Cancel session
  await db
    .update(checkoutSessions)
    .set({ status: "cancelled" })
    .where(eq(checkoutSessions.id, session.id));

  // 2️⃣ Remove checkout items
  await db.delete(checkout).where(eq(checkout.checkoutSessionId, session.id));

  return NextResponse.json({ message: "Checkout cancelled" });
}
