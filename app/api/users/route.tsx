import { requireAdmin } from "@/lib/server-auth";
import { db } from "@/db/drizzle"
import { orders, users } from "@/db/schema"
import { NextResponse } from "next/server"
import { and, eq, ilike, ne, or, sql, type SQL } from "drizzle-orm"
import { likeContains, parseListParams } from "@/lib/admin/list-params"

// Statuses that count as a completed sale (matches the dashboard)
const SALE_STATUSES = sql.raw(`('confirmed','shipped','delivered')`)

// Correlated subqueries use explicit "users"."id" — drizzle drops table
// prefixes in join-less queries, which would mis-bind inside the subquery.
const orderCount = sql<number>`(
  SELECT count(*)::int FROM ${orders} o WHERE o.user_id = ${sql.raw('"users"."id"')}
)`
const totalSpent = sql<string>`(
  SELECT COALESCE(SUM(o.total_amount), 0) FROM ${orders} o
  WHERE o.user_id = ${sql.raw('"users"."id"')} AND o.status IN ${SALE_STATUSES}
)`

const fullName = sql`concat_ws(' ', ${users.firstName}, ${users.lastName})`

const SORT_COLUMNS = {
  fullName,
  email: users.email,
  role: users.role,
  orders: orderCount,
  totalSpent,
  lastLogin: users.lastLogin,
  createdAt: users.createdAt,
} as const
const SORT_KEYS = Object.keys(SORT_COLUMNS) as (keyof typeof SORT_COLUMNS)[]

/*
 * GET /api/users?scope=customers|admins&page=1&pageSize=10&q=&sort=createdAt&dir=desc
 * (admin only)  customers = every non-admin account (verified users + guests)
 * → { data, total, page, pageSize, stats }
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const params = new URL(request.url).searchParams
    const scope = params.get("scope") === "admins" ? "admins" : "customers"
    const list = parseListParams(params, SORT_KEYS, {
      sortKey: "createdAt",
      dir: "desc",
      pageSize: 10,
    })

    const scopeFilter = scope === "admins" ? eq(users.role, "admin") : ne(users.role, "admin")
    const searchFilter: SQL | undefined = list.q
      ? or(
          ilike(fullName, likeContains(list.q)),
          ilike(users.email, likeContains(list.q)),
          ilike(users.phoneNumber, likeContains(list.q)),
        )
      : undefined
    const where = and(scopeFilter, searchFilter)

    const [rows, [{ total }], [stats]] = await Promise.all([
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
          orders: orderCount,
          totalSpent,
        })
        .from(users)
        .where(where)
        .orderBy(list.order(SORT_COLUMNS[list.sortKey]), list.order(users.id))
        .limit(list.pageSize)
        .offset(list.offset),
      db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
      // Summary cards for the selected scope (ignores search)
      db
        .select({
          total: sql<number>`count(*)::int`,
          verified: sql<number>`count(*) FILTER (WHERE ${users.emailVerified} OR ${users.phoneVerified})::int`,
          guests: sql<number>`count(*) FILTER (WHERE ${users.role} = 'guest')::int`,
          withOrders: sql<number>`count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM ${orders} o WHERE o.user_id = ${sql.raw('"users"."id"')}
          ))::int`,
        })
        .from(users)
        .where(scopeFilter),
    ])

    return NextResponse.json(
      {
        data: rows.map((r) => ({ ...r, totalSpent: Number(r.totalSpent) })),
        total,
        page: list.page,
        pageSize: list.pageSize,
        stats,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 })
  }
}
