import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupon-service";
import { requireUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { code, userId, cartTotal } = await request.json();

    const auth = await requireUser(request, userId);
    if (auth.error) return auth.error;

    const result = await validateCoupon(code, auth.user.userId, Number(cartTotal));

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }

    return NextResponse.json(result.coupon, { status: 200 });
  } catch (err) {
    console.error("validate-coupon error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
