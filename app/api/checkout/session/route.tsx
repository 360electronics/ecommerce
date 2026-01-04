import { db } from "@/db/drizzle";
import { checkoutSessions } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/* -----------------------------------------
   GET → FETCH ONLY (NO CREATION)
------------------------------------------ */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // 🔥 Always delete expired sessions
  await db.delete(checkoutSessions).where(
    and(
      eq(checkoutSessions.userId, userId),
      lt(checkoutSessions.expiresAt, new Date())
    )
  );

  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.userId, userId))
    .limit(1);

  // ❗ IMPORTANT: DO NOT CREATE
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
  await db.delete(checkoutSessions).where(
    and(
      eq(checkoutSessions.userId, userId),
      lt(checkoutSessions.expiresAt, new Date())
    )
  );

  // Reuse active session if exists
  const [existing] = await db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.userId, userId))
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

  await db.delete(checkoutSessions).where(eq(checkoutSessions.userId, userId));

  return NextResponse.json({ message: "Checkout session cleared" });
}
