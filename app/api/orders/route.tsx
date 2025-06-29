import { db } from '@/db/drizzle';
import { orderItems, orders, savedAddresses, users, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

interface ErrorResponse {
  message: string;
  error: string;
}

export async function POST(request: Request) {
  try {
    const {
      userId,
      addressId,
      totalAmount,
      discountAmount,
      couponCode,
      shippingAmount,
      deliveryMode,
      paymentMethod,
      status,
      paymentStatus,
      orderItems: items,
    } = await request.json();

    const [newOrder] = await db
      .insert(orders)
      .values({
        userId,
        addressId,
        totalAmount,
        discountAmount,
        couponCode,
        shippingAmount,
        deliveryMode,
        paymentMethod,
        status,
        paymentStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(orderItems).values(
      items.map((item: any) => ({
        orderId: newOrder.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );

    return NextResponse.json(newOrder, { status: 200 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const allOrders = await db.select({ orders: orders, orderItems: orderItems, variants: variants, savedAddresses:savedAddresses }).from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(variants, eq(variants.id, orderItems.variantId))
      .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId))
      ;
    return NextResponse.json({
      success: true,
      data: allOrders,
    });
  } catch (error) {
    console.error("[ORDER_GET_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      {
        message: "Failed to fetch orders",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}