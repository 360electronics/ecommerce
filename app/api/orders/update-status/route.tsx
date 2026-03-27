import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orders } from "@/db/schema";
import { sendOrderStatusUpdateEmail } from "@/lib/nodemailer";
import { getOrderEmailData } from "@/lib/order-email-helper";

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

    // Send status update email to user if status changed (non-blocking)
    if (status) {
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
    }

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
