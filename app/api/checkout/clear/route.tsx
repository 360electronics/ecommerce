import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import { db } from "@/db/drizzle";
import { checkout } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const auth = await requireUser(request, userId);
    if (auth.error) return auth.error;

    // 🔍 Check if checkout exists
    const existing = await db
      .select({ id: checkout.id })
      .from(checkout)
      .where(eq(checkout.userId, userId))
      .limit(1);

    // 🧹 Delete only if exists
    if (existing.length > 0) {
      await db.delete(checkout).where(eq(checkout.userId, userId));
    }

    // ✅ Always succeed (idempotent)
    return NextResponse.json(
      {
        message:
          existing.length > 0
            ? "Checkout cleared successfully"
            : "Checkout already cleared",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
