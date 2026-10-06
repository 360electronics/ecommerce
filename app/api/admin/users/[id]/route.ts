import { NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
  cart,
  orderItems,
  orders,
  products,
  savedAddresses,
  users,
  variants,
  wishlists,
} from "@/db/schema";
import { tickets } from "@/db/schema/tickets/ticket.schema";
import { requireAdmin } from "@/lib/server-auth";

type Params = Promise<{ id: string }>;

const SALE_STATUSES = ["confirmed", "shipped", "delivered"] as const;
const RECENT_ORDERS = 10;

/*
 * GET /api/admin/users/[id] — everything the admin details popup shows:
 * profile, addresses, recent orders (with items) and activity stats.
 */
export async function GET(request: Request, { params }: { params: Params }) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const [[user], addresses, recentOrders, [orderStats], [ticketStats], [wishlistStats], [cartStats]] =
      await Promise.all([
        db
          .select({
            id: users.id,
            image: users.image,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            phoneNumber: users.phoneNumber,
            role: users.role,
            emailVerified: users.emailVerified,
            phoneVerified: users.phoneVerified,
            lastLogin: users.lastLogin,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, id))
          .limit(1),
        db
          .select()
          .from(savedAddresses)
          .where(eq(savedAddresses.userId, id))
          .orderBy(desc(savedAddresses.isDefault), desc(savedAddresses.createdAt)),
        db
          .select({
            id: orders.id,
            createdAt: orders.createdAt,
            status: orders.status,
            paymentStatus: orders.paymentStatus,
            paymentMethod: orders.paymentMethod,
            totalAmount: orders.totalAmount,
            deliveryMode: orders.deliveryMode,
            couponCode: orders.couponCode,
          })
          .from(orders)
          .where(eq(orders.userId, id))
          .orderBy(desc(orders.createdAt))
          .limit(RECENT_ORDERS),
        db
          .select({
            orderCount: sql<number>`count(*)::int`,
            salesCount: sql<number>`count(*) FILTER (WHERE ${inArray(orders.status, [...SALE_STATUSES])})::int`,
            totalSpent: sql<string>`COALESCE(SUM(${orders.totalAmount}) FILTER (WHERE ${inArray(orders.status, [...SALE_STATUSES])}), 0)`,
            cancelledCount: sql<number>`count(*) FILTER (WHERE ${orders.status} = 'cancelled')::int`,
            firstOrderAt: sql<string | null>`MIN(${orders.createdAt})`,
            lastOrderAt: sql<string | null>`MAX(${orders.createdAt})`,
          })
          .from(orders)
          .where(eq(orders.userId, id)),
        db
          .select({
            total: sql<number>`count(*)::int`,
            active: sql<number>`count(*) FILTER (WHERE ${tickets.status} = 'active')::int`,
          })
          .from(tickets)
          .where(eq(tickets.user_id, id)),
        db.select({ count: sql<number>`count(*)::int` }).from(wishlists).where(eq(wishlists.userId, id)),
        db
          .select({ items: sql<number>`COALESCE(SUM(${cart.quantity}), 0)::int` })
          .from(cart)
          .where(eq(cart.userId, id)),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Items for the recent orders only
    const orderIds = recentOrders.map((o) => o.id);
    const items = orderIds.length
      ? await db
          .select({
            orderId: orderItems.orderId,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            productName: products.shortName,
            variantName: variants.name,
            image: sql<string | null>`${variants.productImages}->0->>'url'`,
          })
          .from(orderItems)
          .leftJoin(products, eq(products.id, orderItems.productId))
          .leftJoin(variants, eq(variants.id, orderItems.variantId))
          .where(and(inArray(orderItems.orderId, orderIds)))
      : [];

    const totalSpent = Number(orderStats.totalSpent);

    return NextResponse.json({
      user,
      addresses,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
        items: items
          .filter((i) => i.orderId === o.id)
          .map(({ orderId: _orderId, ...i }) => ({ ...i, unitPrice: Number(i.unitPrice) })),
      })),
      stats: {
        orderCount: orderStats.orderCount,
        salesCount: orderStats.salesCount,
        cancelledCount: orderStats.cancelledCount,
        totalSpent,
        avgOrderValue: orderStats.salesCount ? totalSpent / orderStats.salesCount : 0,
        firstOrderAt: orderStats.firstOrderAt,
        lastOrderAt: orderStats.lastOrderAt,
        tickets: ticketStats.total,
        openTickets: ticketStats.active,
        wishlistItems: wishlistStats.count,
        cartItems: cartStats.items,
      },
    });
  } catch (error) {
    console.error("[ADMIN_USER_DETAILS_ERROR]", error);
    return NextResponse.json({ error: "Failed to load user details" }, { status: 500 });
  }
}
