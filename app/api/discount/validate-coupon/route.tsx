import { db } from "@/db/drizzle";
import { coupons, specialCoupons, specialCouponUsage } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("validate-coupon body:", body);
    console.log("validate-coupon types:", {
      code: body.code,
      codeType: typeof body.code,
      userId: body.userId,
      userIdType: typeof body.userId,
      cartTotal: body.cartTotal,
      cartTotalType: typeof body.cartTotal,
    });

    const { code, userId, cartTotal } = body;

    // 🔐 Normalize & validate inputs
    const normalizedCode =
      typeof code === "string" ? code.trim().toUpperCase() : "";
    const parsedCartTotal = Number(cartTotal);

    if (!normalizedCode || !userId || Number.isNaN(parsedCartTotal)) {
      return NextResponse.json(
        { error: "Invalid request data", code: "INVALID" },
        { status: 400 }
      );
    }

    if (parsedCartTotal <= 0) {
      return NextResponse.json(
        {
          error: "Cart total must be greater than zero",
          code: "MIN_AMOUNT_NOT_MET",
        },
        { status: 400 }
      );
    }

    /* ──────────────────────────────
       1️⃣ TRY INDIVIDUAL COUPON
    ────────────────────────────── */
    const [individual] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, normalizedCode), eq(coupons.userId, userId)));

    if (individual) {
      if (individual.isUsed) {
        return NextResponse.json(
          { error: "Coupon already used", code: "USED" },
          { status: 400 }
        );
      }

      if (new Date(individual.expiryDate) < new Date()) {
        return NextResponse.json(
          { error: "Coupon expired", code: "EXPIRED" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          id: individual.id,
          code: normalizedCode,
          type: "amount",
          value: Number(individual.amount),
          couponType: "individual",
        },
        { status: 200 }
      );
    }

    /* ──────────────────────────────
       2️⃣ TRY SPECIAL COUPON
    ────────────────────────────── */
    const [special] = await db
      .select()
      .from(specialCoupons)
      .where(eq(specialCoupons.code, normalizedCode));

    if (!special) {
      return NextResponse.json(
        { error: "Invalid coupon code", code: "INVALID" },
        { status: 404 }
      );
    }

    if (new Date(special.expiryDate) < new Date()) {
      return NextResponse.json(
        { error: "Coupon expired", code: "EXPIRED" },
        { status: 400 }
      );
    }

    if (Number(special.limit) <= 0) {
      return NextResponse.json(
        { error: "Coupon usage limit reached", code: "LIMIT_REACHED" },
        { status: 400 }
      );
    }

    const minOrderAmount = Number(special.minOrderAmount || 0);
    if (parsedCartTotal < minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order value is ₹${minOrderAmount}`,
          code: "MIN_AMOUNT_NOT_MET",
        },
        { status: 400 }
      );
    }

    const [alreadyUsed] = await db
      .select()
      .from(specialCouponUsage)
      .where(
        and(
          eq(specialCouponUsage.userId, userId),
          eq(specialCouponUsage.couponId, special.id)
        )
      );

    if (alreadyUsed) {
      return NextResponse.json(
        { error: "Coupon already used", code: "USED" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        id: special.id,
        code: normalizedCode,
        type: special.amount ? "amount" : "percentage",
        value: special.amount
          ? Number(special.amount)
          : Number(special.percentage),
        couponType: "special",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("validate-coupon error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
