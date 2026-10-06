import { NextResponse } from "next/server";
import { and, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orderItems, orders, savedAddresses, users } from "@/db/schema";
import { requireAdmin } from "@/lib/server-auth";
import { likeContains, parseListParams } from "@/lib/admin/list-params";

// Admin order tabs → order statuses
const TAB_STATUSES = {
  confirmed: ["confirmed"],
  pending: ["pending"],
  cancelled: ["cancelled"],
  shipped: ["shipped"],
  delivered: ["delivered"],
  others: ["failed", "returned"],
} as const;
type Tab = keyof typeof TAB_STATUSES | "all";

// Explicitly qualified: drizzle drops table prefixes in join-less queries,
// which would make "id" resolve to order_items.id inside the subquery
const itemCount = sql<number>`(
  SELECT COALESCE(SUM(oi.quantity), 0)::int
  FROM ${orderItems} oi WHERE oi.order_id = ${sql.raw('"orders"."id"')}
)`;

const SORT_COLUMNS = {
  id: orders.id,
  customer: savedAddresses.fullName,
  date: orders.createdAt,
  status: orders.status,
  payment: orders.paymentStatus,
  total: orders.totalAmount,
  items: itemCount,
  shippingMethod: orders.deliveryMode,
} as const;
const SORT_KEYS = Object.keys(SORT_COLUMNS) as (keyof typeof SORT_COLUMNS)[];

/*
 * GET /api/admin/orders?page=1&pageSize=10&tab=confirmed&q=&sort=date&dir=desc
 * → { data, total, page, pageSize, counts: { confirmed, pending, …, others, all } }
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const params = new URL(request.url).searchParams;
    const list = parseListParams(params, SORT_KEYS, { sortKey: "date", dir: "desc", pageSize: 10 });
    const tabParam = params.get("tab") as Tab | null;
    const tab: Tab = tabParam && (tabParam === "all" || tabParam in TAB_STATUSES) ? tabParam : "all";

    // Search: order id, customer name/phone, account email/phone
    const searchFilter: SQL | undefined = list.q
      ? or(
          sql`${orders.id}::text ILIKE ${likeContains(list.q)}`,
          ilike(savedAddresses.fullName, likeContains(list.q)),
          ilike(savedAddresses.phoneNumber, likeContains(list.q)),
          ilike(users.email, likeContains(list.q)),
          ilike(users.phoneNumber, likeContains(list.q)),
        )
      : undefined;

    const tabFilter =
      tab === "all" ? undefined : inArray(orders.status, [...TAB_STATUSES[tab]]);
    const where = and(searchFilter, tabFilter);

    const [rows, [{ total }], statusCounts] = await Promise.all([
      db
        .select({
          id: orders.id,
          customer: savedAddresses.fullName,
          email: users.email,
          createdAt: orders.createdAt,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          paymentMethod: orders.paymentMethod,
          totalAmount: orders.totalAmount,
          deliveryMode: orders.deliveryMode,
          items: itemCount,
        })
        .from(orders)
        .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId))
        .leftJoin(users, eq(users.id, orders.userId))
        .where(where)
        .orderBy(list.order(SORT_COLUMNS[list.sortKey]), list.order(orders.id))
        .limit(list.pageSize)
        .offset(list.offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(orders)
        .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId))
        .leftJoin(users, eq(users.id, orders.userId))
        .where(where),
      // Tab badges respect the search but not the tab itself
      db
        .select({ status: orders.status, count: sql<number>`count(*)::int` })
        .from(orders)
        .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId))
        .leftJoin(users, eq(users.id, orders.userId))
        .where(searchFilter)
        .groupBy(orders.status),
    ]);

    const byStatus = Object.fromEntries(statusCounts.map((r) => [r.status, r.count]));
    const counts = Object.fromEntries(
      Object.entries(TAB_STATUSES).map(([key, statuses]) => [
        key,
        statuses.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0),
      ]),
    ) as Record<keyof typeof TAB_STATUSES, number>;

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({ ...r, customer: r.customer ?? "Guest" })),
      total,
      page: list.page,
      pageSize: list.pageSize,
      counts: {
        ...counts,
        all: statusCounts.reduce((sum, r) => sum + r.count, 0),
      },
    });
  } catch (err) {
    console.error("[ADMIN_ORDERS_GET_ERROR]", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
