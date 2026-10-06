import { requireAdmin, requireOwnerOrAdmin } from "@/lib/server-auth";
import { cancelOrder, loadOrderForCancel } from "@/lib/orders/cancel.server";
import {
  DELETABLE_PAYMENT_STATUSES,
  DELETABLE_STATUSES,
  getOrderDeleteBlocker,
} from "@/lib/orders/deletion";
import { releaseOrderStock } from "@/lib/orders/stock";
import { db } from "@/db/drizzle";
import { orders, orderItems, variants, savedAddresses } from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { sendOrderStatusUpdateEmail } from "@/lib/nodemailer";
import { getOrderEmailData } from "@/lib/order-email-helper";

type Params = Promise<{ id: string }>;

interface ErrorResponse {
  message: string;
  error: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { id: orderId } = await params; // Access orderId correctly

  // Owner (profile order page) or admin
  const [owner] = await db
    .select({ userId: orders.userId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const access = await requireOwnerOrAdmin(request, owner?.userId);
  if (access.error) return access.error;


  try {
    const order = await db
      .select({
        orders: orders,
        orderItems: orderItems,
        variants: variants,
        savedAddresses: savedAddresses,
      })
      .from(orders)
      .where(eq(orders.id, orderId)) // Filter by orderId
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(variants, eq(variants.id, orderItems.variantId))
      .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId));

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("[ORDER_GET_ERROR]", error);
    return NextResponse.json(
      {
        message: "Failed to fetch order",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["returned", "cancelled"],
  returned: ["cancelled"],
  cancelled: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const { id: orderId } = await params; // ✅ Await the promise
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["shipped", "delivered", "cancelled", "returned"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid status. Must be one of: shipped, delivered, cancelled, returned",
        },
        { status: 400 }
      );
    }

    // Fetch current order status
    const [currentOrder] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[currentOrder.status];

    if (!allowedNextStatuses || !allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot change status from ${currentOrder.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Cancelling records the charge/refund — always go through cancelOrder
    if (status === "cancelled") {
      const { cancelledBy, reason } = body;
      if (cancelledBy !== "customer" && cancelledBy !== "store") {
        return NextResponse.json(
          {
            success: false,
            message: "cancelledBy is required: 'customer' (charge applies) or 'store' (full refund)",
          },
          { status: 400 }
        );
      }
      const fullOrder = await loadOrderForCancel(orderId);
      if (!fullOrder) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }
      const result = await cancelOrder(fullOrder, cancelledBy, typeof reason === "string" ? reason : null);
      if (!result.ok) {
        return NextResponse.json({ success: false, message: result.error }, { status: result.status });
      }
      return NextResponse.json({ success: true, data: result.order, cancellation: result.quote });
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Returned goods are back on the shelf
    if (status === "returned") {
      await releaseOrderStock(orderId);
    }

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

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("[ORDER_PATCH_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order status",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const { id: orderId } = await params; // ✅ Await the promise

    // Only abandoned online-payment orders can be deleted. The conditions are
    // part of the DELETE itself, so an order that gets paid concurrently can't
    // be removed. order_items are removed by ON DELETE CASCADE.
    const [deletedOrder] = await db
      .delete(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.paymentMethod, "razorpay"),
          isNull(orders.paymentId),
          inArray(orders.paymentStatus, [...DELETABLE_PAYMENT_STATUSES]),
          inArray(orders.status, [...DELETABLE_STATUSES]),
        )
      )
      .returning({ id: orders.id });

    if (!deletedOrder) {
      const [existing] = await db
        .select({
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          paymentStatus: orders.paymentStatus,
          paymentId: orders.paymentId,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: getOrderDeleteBlocker(existing) ?? "This order can't be deleted",
        },
        { status: 409 }
      );
    }

    console.info("[ORDER_DELETED]", { orderId, by: admin.user.userId });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("[ORDER_DELETE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete order",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
