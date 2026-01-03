import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const couponList = await db
      .select()
      .from(coupons)
      .where(eq(coupons.userId, userId));

    console.log(couponList);

    return NextResponse.json(couponList);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
