import { NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { savedAddresses, users } from "@/db/schema";
import { ticketReplies, tickets } from "@/db/schema/tickets/ticket.schema";
import { requireAdmin } from "@/lib/server-auth";
import { likeContains, parseListParams } from "@/lib/admin/list-params";

const STATUSES = ["active", "inactive", "closed"] as const;

/*
 * GET /api/admin/tickets?page=1&pageSize=12&status=all|active|inactive|closed&q=
 * → { data, total, page, pageSize, stats: { total, active, inactive, closed, avgResponseHours } }
 * Paginates tickets first, then loads replies/addresses for just that page
 * (separate queries — joining both at once duplicated every reply).
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const params = new URL(request.url).searchParams;
    const list = parseListParams(params, ["createdAt"] as const, {
      sortKey: "createdAt",
      dir: "desc",
      pageSize: 12,
    });
    const statusParam = params.get("status");
    const status = STATUSES.find((s) => s === statusParam);

    const customerName = sql`concat_ws(' ', ${users.firstName}, ${users.lastName})`;
    const searchFilter: SQL | undefined = list.q
      ? or(
          sql`${tickets.id}::text ILIKE ${likeContains(list.q)}`,
          ilike(tickets.type, likeContains(list.q)),
          ilike(customerName, likeContains(list.q)),
          ilike(users.email, likeContains(list.q)),
        )
      : undefined;
    const where = and(searchFilter, status ? eq(tickets.status, status) : undefined);

    const [pageRows, [{ total }], [stats]] = await Promise.all([
      db
        .select({
          id: tickets.id,
          user_id: tickets.user_id,
          type: tickets.type,
          issueDesc: tickets.issue_desc,
          status: tickets.status,
          createdAt: tickets.createdAt,
          customer: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            phoneNumber: users.phoneNumber,
            role: users.role,
          },
        })
        .from(tickets)
        .leftJoin(users, eq(tickets.user_id, users.id))
        .where(where)
        .orderBy(list.order(tickets.createdAt), desc(tickets.id))
        .limit(list.pageSize)
        .offset(list.offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(tickets)
        .leftJoin(users, eq(tickets.user_id, users.id))
        .where(where),
      // Dashboard cards: whole table, not just this page
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) FILTER (WHERE ${tickets.status} = 'active')::int`,
          inactive: sql<number>`count(*) FILTER (WHERE ${tickets.status} = 'inactive')::int`,
          closed: sql<number>`count(*) FILTER (WHERE ${tickets.status} = 'closed')::int`,
          avgResponseHours: sql<number | null>`(
            SELECT AVG(EXTRACT(EPOCH FROM (fr.first_reply - t.created_at)) / 3600)
            FROM ${tickets} t
            JOIN LATERAL (
              SELECT MIN(r.created_at) AS first_reply
              FROM ${ticketReplies} r
              WHERE r.ticket_id = t.id AND r.sender = 'support'
            ) fr ON fr.first_reply IS NOT NULL
          )`,
        })
        .from(tickets),
    ]);

    const ticketIds = pageRows.map((t) => t.id);
    const userIds = [...new Set(pageRows.map((t) => t.user_id))];

    const [replies, addresses] = ticketIds.length
      ? await Promise.all([
          db
            .select()
            .from(ticketReplies)
            .where(inArray(ticketReplies.ticket_id, ticketIds))
            .orderBy(asc(ticketReplies.createdAt)),
          db
            .select()
            .from(savedAddresses)
            .where(inArray(savedAddresses.userId, userIds)),
        ])
      : [[], []];

    const data = pageRows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      issueDesc: row.issueDesc,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      customer: {
        id: row.customer?.id ?? "",
        name: row.customer?.firstName
          ? `${row.customer.firstName} ${row.customer.lastName || ""}`.trim()
          : "Guest",
        email: row.customer?.email ?? "",
        phoneNumber: row.customer?.phoneNumber ?? "",
        role: row.customer?.role ?? "user",
      },
      addresses: addresses
        .filter((a) => a.userId === row.user_id)
        .map((a) => ({
          id: a.id,
          fullName: a.fullName,
          phoneNumber: a.phoneNumber,
          addressLine1: a.addressLine1,
          addressLine2: a.addressLine2,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          country: a.country,
          addressType: a.addressType,
          isDefault: a.isDefault,
        })),
      replies: replies
        .filter((r) => r.ticket_id === row.id)
        .map((r) => ({
          id: r.id,
          sender: r.sender,
          message: r.message,
          createdAt: r.createdAt.toISOString(),
        })),
    }));

    return NextResponse.json({
      data,
      total,
      page: list.page,
      pageSize: list.pageSize,
      stats: {
        ...stats,
        avgResponseHours: stats.avgResponseHours != null ? Number(stats.avgResponseHours) : null,
      },
    });
  } catch (error) {
    console.error("[ADMIN_TICKETS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
