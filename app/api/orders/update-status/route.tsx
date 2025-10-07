import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orders } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { orderId, status, paymentStatus } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await db
      .update(orders)
      .set({
        status,
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json(
      { message: "Payment status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
