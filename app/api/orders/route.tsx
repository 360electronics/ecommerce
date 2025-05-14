import { db } from '@/db/drizzle';
import { orderItems, orders } from '@/db/schema';
import { NextResponse } from 'next/server';

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