import { db } from "@/db/drizzle";
import { checkout, checkoutSessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


// DELETE /api/checkout/cancel?userId=...

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    /* Find active checkout session */
    const [session] = await db
      .select()
      .from(checkoutSessions)
      .where(
        and(
          eq(checkoutSessions.userId, userId),
          eq(checkoutSessions.status, "active")
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { message: "No active checkout session found" },
        { status: 200 }
      );
    }

    /* Mark session as cancelled */
    await db
      .update(checkoutSessions)
      .set({
        status: "cancelled",
      })
      .where(eq(checkoutSessions.id, session.id));

    /* Remove checkout items for that session */
    await db
      .delete(checkout)
      .where(eq(checkout.checkoutSessionId, session.id));

    return NextResponse.json(
      { message: "Checkout cancelled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CHECKOUT_CANCEL_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to cancel checkout" },
      { status: 500 }
    );
  }
}
