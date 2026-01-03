import { db } from "@/db/drizzle";
import { specialCoupons, specialCouponUsage } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Coupon code and user ID are required", code: "INVALID" },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      // 🔒 Lock coupon row
      const [coupon] = await tx
        .select()
        .from(specialCoupons)
        .where(eq(specialCoupons.code, code))
        .for("update");

      if (!coupon) {
        throw { code: "NOT_FOUND", status: 404 };
      }

      if (new Date(coupon.expiryDate) < new Date()) {
        throw { code: "EXPIRED", status: 400 };
      }

      if (Number(coupon.limit) <= 0) {
        throw { code: "LIMIT_REACHED", status: 400 };
      }

      // 🧠 Idempotency check
      const [existingUsage] = await tx
        .select()
        .from(specialCouponUsage)
        .where(
          and(
            eq(specialCouponUsage.userId, userId),
            eq(specialCouponUsage.couponId, coupon.id)
          )
        );

      if (existingUsage) {
        throw { code: "USED", status: 400 };
      }

      // ✅ Record usage
      await tx.insert(specialCouponUsage).values({
        userId,
        couponId: coupon.id,
      });

      // ✅ Atomic decrement
      await tx
        .update(specialCoupons)
        .set({
          limit: sql`${specialCoupons.limit} - 1`,
        })
        .where(eq(specialCoupons.id, coupon.id));
    });

    return NextResponse.json(
      { message: "Special coupon marked as used" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Special coupon usage error:", err);

    if (err?.code) {
      const map: Record<string, string> = {
        NOT_FOUND: "Coupon not found",
        EXPIRED: "Coupon expired",
        LIMIT_REACHED: "Coupon usage limit reached",
        USED: "Coupon already used",
      };

      return NextResponse.json(
        { error: map[err.code], code: err.code },
        { status: err.status || 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
