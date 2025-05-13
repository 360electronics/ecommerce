import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { orders, orderItems, products, variants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Extract userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    // Validate userId presence
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch orders with order items, products, and variants
    const userOrders = await db
      .select({
        order: {
          id: orders.id,
          userId: orders.userId,
          addressId: orders.addressId,
          razorpayOrderId: orders.razorpayOrderId,
          razorpayPaymentId: orders.razorpayPaymentId,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          paymentMethod: orders.paymentMethod,
          totalAmount: orders.totalAmount,
          shippingAmount: orders.shippingAmount,
          deliveryMode: orders.deliveryMode,
          orderNotes: orders.orderNotes,
          trackingNumber: orders.trackingNumber,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          deliveredAt: orders.deliveredAt,
        },
        orderItem: {
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          variantId: orderItems.variantId,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
        },
        product: {
          id: products.id,
          shortName: products.shortName,
          description: products.description,
          category: products.category,
          brand: products.brand,
          status: products.status,
          subProductStatus: products.subProductStatus,
          totalStocks: products.totalStocks,
          deliveryMode: products.deliveryMode,
          tags: products.tags,
          averageRating: products.averageRating,
          ratingCount: products.ratingCount,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
        variant: {
          id: variants.id,
          productId: variants.productId,
          name: variants.name,
          sku: variants.sku,
          slug: variants.slug,
          color: variants.color,
          material: variants.material,
          dimensions: variants.dimensions,
          weight: variants.weight,
          storage: variants.storage,
          stock: variants.stock,
          mrp: variants.mrp,
          ourPrice: variants.ourPrice,
          productImages: variants.productImages,
          createdAt: variants.createdAt,
          updatedAt: variants.updatedAt,
        },
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(variants, eq(orderItems.variantId, variants.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      console.log("No orders found for user:", userId);
      return NextResponse.json({ message: "No orders found" }, { status: 404 });
    }

    // Group order items and their products/variants by order
    const formattedOrders = userOrders.reduce(
      (acc, { order, orderItem, product, variant }) => {
        const existingOrder = acc.find((o) => o.id === order.id);
        const item = orderItem
          ? {
              id: orderItem.id,
              orderId: orderItem.orderId,
              productId: orderItem.productId,
              variantId: orderItem.variantId,
              quantity: orderItem.quantity,
              unitPrice: orderItem.unitPrice,
              product: product
                ? {
                    id: product.id,
                    shortName: product.shortName,
                    description: product.description,
                    category: product.category,
                    brand: product.brand,
                    status: product.status,
                    subProductStatus: product.subProductStatus,
                    totalStocks: product.totalStocks,
                    deliveryMode: product.deliveryMode,
                    tags: product.tags,
                    averageRating: product.averageRating,
                    ratingCount: product.ratingCount,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                  }
                : null,
              variant: variant
                ? {
                    id: variant.id,
                    productId: variant.productId,
                    name: variant.name,
                    sku: variant.sku,
                    slug: variant.slug,
                    color: variant.color,
                    material: variant.material,
                    dimensions: variant.dimensions,
                    weight: variant.weight,
                    storage: variant.storage,
                    stock: variant.stock,
                    mrp: variant.mrp,
                    ourPrice: variant.ourPrice,
                    productImages: variant.productImages,
                    createdAt: variant.createdAt,
                    updatedAt: variant.updatedAt,
                  }
                : null,
            }
          : null;

        if (existingOrder) {
          if (item) {
            existingOrder.items.push(item);
          }
        } else {
          acc.push({
            ...order,
            items: item ? [item] : [],
          });
        }
        return acc;
      },
      [] as Array<
        typeof orders.$inferSelect & {
          items: Array<
            typeof orderItems.$inferSelect & {
              product: Omit<typeof products.$inferSelect, "specifications"> | null;
              variant: typeof variants.$inferSelect | null;
            }
          >;
        }
      >
    );

    return NextResponse.json(formattedOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}