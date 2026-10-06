import { NextRequest, NextResponse } from "next/server";
import { consumeCoupon, validateCoupon } from "@/lib/coupon-service";
import { requireUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required", code: "INVALID" },
        { status: 400 }
      );
    }

    const auth = await requireUser(request, userId);
    if (auth.error) return auth.error;

    // Atomic: records usage + decrements limit in a single statement
    const consumed = await consumeCoupon(code, auth.user.userId);

    if (!consumed) {
      // Work out why, for a meaningful error code
      const check = await validateCoupon(code, auth.user.userId, Number.MAX_SAFE_INTEGER);
      const errorCode = check.ok ? "LIMIT_REACHED" : check.code;
      const map: Record<string, string> = {
        INVALID: "Coupon not found",
        EXPIRED: "Coupon expired",
        LIMIT_REACHED: "Coupon usage limit reached",
        USED: "Coupon already used",
      };

      return NextResponse.json(
        { error: map[errorCode] ?? "Coupon cannot be used", code: errorCode },
        { status: check.ok ? 400 : check.status }
      );
    }

    return NextResponse.json(
      { message: "Special coupon marked as used" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Special coupon usage error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
