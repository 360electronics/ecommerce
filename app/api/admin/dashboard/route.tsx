import { db } from "@/db/drizzle";
import {
  orders,
  orderItems,
  variants,
  savedAddresses,
} from "@/db/schema";
import { tickets } from "@/db/schema/tickets/ticket.schema";
import { eq, sql, inArray, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

const SALES_STATUSES = ["confirmed", "shipped", "delivered"] as const;

/* ===============================
   RANGE → DATE
================================ */
function getStartDate(range: string | null) {
  const now = new Date();
  const d = new Date(now);

  switch (range) {
    case "today":
      d.setHours(0, 0, 0, 0);
      return d;
    case "7d":
      d.setDate(d.getDate() - 7);
      return d;
    case "15d":
      d.setDate(d.getDate() - 15);
      return d;
    case "30d":
      d.setDate(d.getDate() - 30);
      return d;
    case "3m":
      d.setMonth(d.getMonth() - 3);
      return d;
    default:
      d.setMonth(d.getMonth() - 12); // fallback
      return d;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range");
    const startDate = getStartDate(range);

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    /* ===========================
       1️⃣ ORDERS (FILTERED BY RANGE)
    =========================== */
    const ordersData = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        paymentMethod: orders.paymentMethod,
        customer: savedAddresses.fullName,
        city: savedAddresses.city,
      })
      .from(orders)
      .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId))
      .where(gte(orders.createdAt, startDate));

    const salesOrders = ordersData.filter((o) =>
      SALES_STATUSES.includes(o.status as any)
    );

    const sum = (rows: typeof salesOrders) =>
      rows.reduce((s, o) => s + Number(o.totalAmount), 0);

    /* ===========================
       2️⃣ METRICS
    =========================== */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todaySales = sum(
      salesOrders.filter((o) => new Date(o.createdAt) >= today)
    );

    const yesterdaySales = sum(
      salesOrders.filter(
        (o) =>
          new Date(o.createdAt) >= yesterday &&
          new Date(o.createdAt) < today
      )
    );

    const totalSales = sum(salesOrders);
    const totalOrders = salesOrders.length;

    /* ===========================
       3️⃣ OPEN TICKETS
    =========================== */
    const openTicketsRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(sql`${tickets.status} IN ('active','inactive')`);

    const openTickets = openTicketsRes[0]?.count ?? 0;

    /* ===========================
       4️⃣ SALES CHART
    =========================== */
    const salesByPeriod: Record<string, number> = {};

    salesOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key =
        range === "today"
          ? d.toLocaleTimeString("en-IN", { hour: "2-digit" })
          : d.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });

      salesByPeriod[key] =
        (salesByPeriod[key] || 0) + Number(o.totalAmount);
    });

    const chartLabels = Object.keys(salesByPeriod);
    const chartData = chartLabels.map((k) => salesByPeriod[k]);

    /* ===========================
       5️⃣ TOP PRODUCTS
    =========================== */
    const topProductsRows = await db
      .select({
        name: variants.name,
        image: sql<string>`
          MIN(variants.product_images->0->>'url')
        `,
        sales: sql<number>`
          SUM(order_items.quantity * order_items.unit_price)
        `,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(variants, eq(orderItems.variantId, variants.id))
      .where(
        inArray(orders.status, SALES_STATUSES)
      )
      .groupBy(variants.name)
      .orderBy(
        sql`SUM(order_items.quantity * order_items.unit_price) DESC`
      )
      .limit(4);

    const topProducts = topProductsRows.map((p) => ({
      name: p.name,
      sales: Number(p.sales),
      image: p.image ?? "/placeholder.svg",
    }));

    /* ===========================
       6️⃣ RECENT TRANSACTIONS
    =========================== */
    const recentTransactions = ordersData
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        status: o.status,
        amount: Number(o.totalAmount),
        date: new Date(o.createdAt).toLocaleDateString("en-IN"),
        paymentMethod: o.paymentMethod,
        customer: o.customer ?? "Guest",
        city: o.city ?? "—",
      }));

    return NextResponse.json({
      metrics: {
        todaySales,
        todaySalesIncrease: todaySales >= yesterdaySales,
        totalSales,
        totalSalesIncrease: true,
        totalOrders,
        totalOrdersIncrease: true,
        openTickets,
        openTicketsIncrease: true,
      },
      salesChart: {
        labels: chartLabels,
        data: chartData,
      },
      topProducts,
      recentTransactions,
      range,
    });
  } catch (err) {
    console.error("[DASHBOARD_API_ERROR]", err);
    return NextResponse.json(
      { message: "Dashboard fetch failed" },
      { status: 500 }
    );
  }
}
