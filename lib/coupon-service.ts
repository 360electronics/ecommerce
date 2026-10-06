import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { coupons, specialCoupons, specialCouponUsage } from "@/db/schema";

export type CouponErrorCode =
  | "INVALID"
  | "EXPIRED"
  | "USED"
  | "LIMIT_REACHED"
  | "MIN_AMOUNT_NOT_MET";

export interface ValidCoupon {
  id: string;
  code: string;
  type: "amount" | "percentage";
  value: number;
  couponType: "individual" | "special";
}

export type CouponValidationResult =
  | { ok: true; coupon: ValidCoupon }
  | { ok: false; code: CouponErrorCode; error: string; status: number };

const fail = (
  code: CouponErrorCode,
  error: string,
  status = 400,
): CouponValidationResult => ({ ok: false, code, error, status });

export const normalizeCouponCode = (code: unknown) =>
  typeof code === "string" ? code.trim().toUpperCase() : "";

// Single source of truth for coupon validity — used by /api/discount/validate-coupon
// (preview) and /api/orders (authoritative re-check at order time).
export async function validateCoupon(
  rawCode: unknown,
  userId: string,
  cartTotal: number,
): Promise<CouponValidationResult> {
  const code = normalizeCouponCode(rawCode);

  if (!code || !userId || Number.isNaN(cartTotal)) {
    return fail("INVALID", "Invalid request data");
  }

  if (cartTotal <= 0) {
    return fail("MIN_AMOUNT_NOT_MET", "Cart total must be greater than zero");
  }

  /* 1️⃣ Individual coupon (owned by this user) */
  const [individual] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.code, code), eq(coupons.userId, userId)));

  if (individual) {
    if (individual.isUsed) return fail("USED", "Coupon already used");
    if (new Date(individual.expiryDate) < new Date())
      return fail("EXPIRED", "Coupon expired");

    return {
      ok: true,
      coupon: {
        id: individual.id,
        code,
        type: "amount",
        value: Number(individual.amount),
        couponType: "individual",
      },
    };
  }

  /* 2️⃣ Special coupon */
  const [special] = await db
    .select()
    .from(specialCoupons)
    .where(eq(specialCoupons.code, code));

  if (!special) return fail("INVALID", "Invalid coupon code", 404);

  if (new Date(special.expiryDate) < new Date())
    return fail("EXPIRED", "Coupon expired");

  if (Number(special.limit) <= 0)
    return fail("LIMIT_REACHED", "Coupon usage limit reached");

  const minOrderAmount = Number(special.minOrderAmount || 0);
  if (cartTotal < minOrderAmount) {
    return fail("MIN_AMOUNT_NOT_MET", `Minimum order value is ₹${minOrderAmount}`);
  }

  const [alreadyUsed] = await db
    .select({ id: specialCouponUsage.id })
    .from(specialCouponUsage)
    .where(
      and(
        eq(specialCouponUsage.userId, userId),
        eq(specialCouponUsage.couponId, special.id),
      ),
    );

  if (alreadyUsed) return fail("USED", "Coupon already used");

  return {
    ok: true,
    coupon: {
      id: special.id,
      code,
      type: special.amount ? "amount" : "percentage",
      value: special.amount ? Number(special.amount) : Number(special.percentage),
      couponType: "special",
    },
  };
}

// Mark a coupon as consumed by this user. Each branch is a single atomic SQL
// statement (neon-http has no interactive transactions). Returns false when the
// coupon was already used / exhausted.
export async function consumeCoupon(rawCode: unknown, userId: string): Promise<boolean> {
  const code = normalizeCouponCode(rawCode);
  if (!code || !userId) return false;

  const usedIndividual = await db
    .update(coupons)
    .set({ isUsed: true })
    .where(
      and(eq(coupons.code, code), eq(coupons.userId, userId), eq(coupons.isUsed, false)),
    )
    .returning({ id: coupons.id });

  if (usedIndividual.length > 0) return true;

  // Record usage (unique per user+coupon) and decrement the limit in one statement
  const result = await db.execute(sql`
    WITH coupon AS (
      SELECT id FROM ${specialCoupons}
      WHERE code = ${code} AND expiry_date >= now() AND "limit" > 0
    ),
    usage AS (
      INSERT INTO ${specialCouponUsage} (user_id, coupon_id)
      SELECT ${userId}::uuid, id FROM coupon
      ON CONFLICT (user_id, coupon_id) DO NOTHING
      RETURNING coupon_id
    )
    UPDATE ${specialCoupons}
    SET "limit" = "limit" - 1
    WHERE id IN (SELECT coupon_id FROM usage)
    RETURNING id
  `);

  return result.rows.length > 0;
}
