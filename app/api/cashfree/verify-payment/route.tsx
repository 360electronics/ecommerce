import { NextResponse } from "next/server";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX, // or CFEnvironment.PRODUCTION
  process.env.NEXT_PUBLIC_CASHFREE_APP_ID!,
  process.env.CASHFREE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    const response = await cashfree.PGOrderFetchPayments(orderId);
    const payment = response.data?.[0];

    if (!payment) {
      return NextResponse.json(
        { error: "No payment details found" },
        { status: 404 }
      );
    }

    let statusUpdate: Partial<typeof orders.$inferInsert> = {};

    switch (payment.payment_status) {
      case "SUCCESS":
        if (payment.is_captured) {
          statusUpdate = {
            cashfreeOrderId: payment.payment_gateway_details?.gateway_order_id,
            cashfreePaymentId: payment.cf_payment_id,
            paymentStatus: "paid",
            status: "confirmed",
          };
        }
        break;

      case "PENDING":
        statusUpdate = {
          paymentStatus: "pending",
          status: "pending",
        };
        break;

      case "USER_DROPPED":
        statusUpdate = {
          paymentStatus: "failed",
          status: "cancelled",
        };
        break;

      default: // FAILED or anything else
        statusUpdate = {
          paymentStatus: "failed",
          status: "failed",
        };
        break;
    }

    await db.update(orders).set(statusUpdate).where(eq(orderId, payment.order_id));

    return NextResponse.json({ success: true, payment, statusUpdate });
  } catch (error: any) {
    console.error("Error verifying payment:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
