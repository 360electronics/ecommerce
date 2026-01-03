import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { specialCoupons } from "@/db/schema";
import { eq } from "drizzle-orm";

type params = Promise<{id: string}>

export async function PATCH(
  req: Request,
  { params }: { params: params }
) {
  const updates = await req.json();

  const [updated] = await db
    .update(specialCoupons)
    .set(updates)
    .where(eq(specialCoupons.id, params.id))
    .returning();

  return NextResponse.json({ updated });
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  await db
    .delete(specialCoupons)
    .where(eq(specialCoupons.id, params.id));

  return NextResponse.json({ success: true });
}
