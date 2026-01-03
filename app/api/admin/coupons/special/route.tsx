import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { specialCoupons } from "@/db/schema";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    code,
    amount,
    percentage,
    limit,
    minOrderAmount,
    expiryDate,
  } = body;

  if (!code || !limit || !expiryDate) {
    return NextResponse.json(
      { error: "Required fields missing" },
      { status: 400 }
    );
  }

  const [coupon] = await db.insert(specialCoupons).values({
    code,
    amount,
    percentage,
    limit,
    minOrderAmount,
    expiryDate: new Date(expiryDate),
  }).returning();

  return NextResponse.json({ coupon }, { status: 201 });
}

export async function GET() {
  const coupons = await db.select().from(specialCoupons);
  return NextResponse.json({ coupons });
}
