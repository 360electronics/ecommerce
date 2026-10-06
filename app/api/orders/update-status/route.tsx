import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orders } from "@/db/schema";
import { sendOrderStatusUpdateEmail } from "@/lib/nodemailer";
import { getOrderEmailData } from "@/lib/order-email-helper";
import { requireUser } from "@/lib/server-auth";
import { releaseOrderStock } from "@/lib/orders/stock";

// Customer-facing only: lets the buyer mark their own unpaid online order as
// cancelled (payment dismissed) or failed (payment error). Confirming / paying
// is done server-side (POST /api/orders for COD, Razorpay verify for online).
// Admin status changes go through PATCH /api/orders/[id].
const USER_ALLOWED_STATUSES = ["cancelled", "failed"] as const;
type UserAllowedStatus = (typeof USER_ALLOWED_STATUSES)[number];

export async function POST(request: Request) {
  try {
    const { orderId, status } = await request.json();

    const auth = await requireUser(request);
    if (auth.error) return auth.error;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    if (!USER_ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Status change not allowed" }, { status: 403 });
    }

    const updated = await db
      .update(orders)
      .set({
        status: status as UserAllowedStatus,
        paymentStatus: "failed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.userId, auth.user.userId),
          eq(orders.paymentMethod, "razorpay"),
          inArray(orders.paymentStatus, ["pending", "failed"]),
          inArray(orders.status, ["pending", "failed"]),
        ),
      )
      .returning({ id: orders.id });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Order cannot be updated" },
        { status: 409 }
      );
    }

    // Payment dismissed / failed → free the reserved stock right away.
    // (A later successful retry re-reserves it in markOrderPaid.)
    await releaseOrderStock(orderId);

    // Send status update email to user (non-blocking)
    getOrderEmailData(orderId).then((emailData) => {
      if (emailData) {
        sendOrderStatusUpdateEmail(
          {
            orderId: emailData.orderId,
            customerName: emailData.customerName,
            customerEmail: emailData.customerEmail,
            totalAmount: emailData.totalAmount,
          },
          status
        );
      }
    }).catch((err) => console.error("[ORDER_STATUS_EMAIL_ERROR]", err));

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
