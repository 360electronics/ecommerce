import { NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { checkout, orders } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const {
      payment_id,
      gateway_order_id,
      razorpay_signature,
      orderId,
      userId,
    } = await request.json();

    // Verify the payment signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${gateway_order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    console.log("Verify request:", {
      payment_id,
      gateway_order_id,
      razorpay_signature,
      orderId,
      userId,
    });
    console.log("Generated Signature:", generatedSignature);

    if (generatedSignature !== razorpay_signature) {
      await db
        .update(orders)
        .set({ paymentStatus: "failed", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Update order with payment details
    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        paymentId: payment_id,
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Clear checkout items
    await db.delete(checkout).where(eq(checkout.userId, userId));

    return NextResponse.json(
      { message: "Payment verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
