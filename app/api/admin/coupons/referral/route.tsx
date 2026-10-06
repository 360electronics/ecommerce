import { requireAdmin } from "@/lib/server-auth";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { coupons, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const data = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      amount: coupons.amount,
      isUsed: coupons.isUsed,
      expiryDate: coupons.expiryDate,
      createdAt: coupons.createdAt,
      user: {
        id: users.id,
        email: users.email,
      },
    })
    .from(coupons)
    .leftJoin(users, eq(coupons.userId, users.id))
    .orderBy(coupons.createdAt);

  return NextResponse.json({ data });
}
