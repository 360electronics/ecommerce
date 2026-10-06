import { requireAdmin } from "@/lib/server-auth";
import { db } from "@/db/drizzle";
import {
  orders,
  orderItems,
  variants,
  savedAddresses,
} from "@/db/schema";
import { tickets } from "@/db/schema/tickets/ticket.schema";
import { eq, sql, inArray, gte, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

const SALES_STATUSES = ["confirmed", "shipped", "delivered"] as const;

/* ===============================
   IST HELPERS
   Vercel runs in UTC; the business day is India time (UTC+5:30, no DST).
================================ */
const IST_TZ = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Midnight IST `daysAgo` days back, as a UTC Date
function istStartOfDay(daysAgo = 0) {
  const istNow = Date.now() + IST_OFFSET_MS;
  const istMidnight = istNow - (istNow % DAY_MS);
  return new Date(istMidnight - IST_OFFSET_MS - daysAgo * DAY_MS);
}

/* ===============================
   RANGE → DATE
================================ */
function getStartDate(range: string | null) {
  const now = new Date();
  const d = new Date(now);

  switch (range) {
    case "today":
      return istStartOfDay(0);
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
  const admin = await requireAdmin(req);
  if (admin.error) return admin.error;

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range");
    const startDate = getStartDate(range);
    const todayStart = istStartOfDay(0);
    const yesterdayStart = istStartOfDay(1);
    // Always include yesterday so "today vs yesterday" works for every range
    const queryStart = startDate < yesterdayStart ? startDate : yesterdayStart;

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    /* ===========================
       1️⃣ QUERIES (independent → parallel)
    =========================== */
    const [allOrdersData, openTicketsRes, topProductsRows] = await Promise.all([
      db
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
        .where(gte(orders.createdAt, queryStart))
        .orderBy(asc(orders.createdAt)),
      // Open = active (statuses are active / inactive)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(tickets)
        .where(eq(tickets.status, "active")),
      db
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
        .where(inArray(orders.status, SALES_STATUSES))
        .groupBy(variants.name)
        .orderBy(sql`SUM(order_items.quantity * order_items.unit_price) DESC`)
        .limit(4),
    ]);

    const isSale = (o: (typeof allOrdersData)[number]) =>
      SALES_STATUSES.includes(o.status as any);

    // Selected range only (allOrdersData may also include yesterday)
    const ordersData = allOrdersData.filter(
      (o) => new Date(o.createdAt) >= startDate
    );

    const salesOrders = ordersData.filter((o) =>
      SALES_STATUSES.includes(o.status as any)
    );

    const sum = (rows: typeof salesOrders) =>
      rows.reduce((s, o) => s + Number(o.totalAmount), 0);

    /* ===========================
       2️⃣ METRICS
    =========================== */
    const todaySales = sum(
      allOrdersData.filter(
        (o) => isSale(o) && new Date(o.createdAt) >= todayStart
      )
    );

    const yesterdaySales = sum(
      allOrdersData.filter(
        (o) =>
          isSale(o) &&
          new Date(o.createdAt) >= yesterdayStart &&
          new Date(o.createdAt) < todayStart
      )
    );

    const totalSales = sum(salesOrders);
    const totalOrders = salesOrders.length;

    const openTickets = openTicketsRes[0]?.count ?? 0;

    /* ===========================
       4️⃣ SALES CHART
    =========================== */
    const salesByPeriod: Record<string, number> = {};

    salesOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key =
        range === "today"
          ? d.toLocaleTimeString("en-IN", { hour: "2-digit", timeZone: IST_TZ })
          : d.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              timeZone: IST_TZ,
            });

      salesByPeriod[key] =
        (salesByPeriod[key] || 0) + Number(o.totalAmount);
    });

    const chartLabels = Object.keys(salesByPeriod);
    const chartData = chartLabels.map((k) => salesByPeriod[k]);

    const topProducts = topProductsRows.map((p) => ({
      name: p.name,
      sales: Number(p.sales),
      image: p.image ?? "/placeholder.svg",
    }));

    /* ===========================
       6️⃣ RECENT TRANSACTIONS
    =========================== */
    const recentTransactions = [...ordersData]
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
        date: new Date(o.createdAt).toLocaleDateString("en-IN", { timeZone: IST_TZ }),
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
