import { db } from "@/db/drizzle"
import { orders, orderItems } from "@/db/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ["shipped", "delivered", "cancelled", "returned"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be one of: shipped, delivered, cancelled, returned" },
        { status: 400 }
      )
    }

    // Fetch current order status
    const [currentOrder] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))

    if (!currentOrder) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    // Enforce ascending status transition
    const statusOrder = ["confirmed", "shipped", "delivered", "cancelled", "returned"]
    const currentIndex = statusOrder.indexOf(currentOrder.status)
    const newIndex = statusOrder.indexOf(status)
    if (currentIndex === -1 || newIndex === -1 || newIndex < currentIndex) {
      return NextResponse.json(
        { success: false, message: `Cannot change status from ${currentOrder.status} to ${status}. Status must follow the order: confirmed → shipped → delivered → cancelled → returned` },
        { status: 400 }
      )
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning()

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedOrder })
  } catch (error) {
    console.error("[ORDER_PATCH_ERROR]", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order status",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    // Delete order and related orderItems
    const [deletedOrder] = await db
      .delete(orders)
      .where(eq(orders.id, orderId))
      .returning()

    if (!deletedOrder) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    // Delete related orderItems
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId))

    return NextResponse.json({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("[ORDER_DELETE_ERROR]", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete order",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}