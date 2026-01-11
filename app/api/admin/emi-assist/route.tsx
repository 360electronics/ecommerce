import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { emiAssistRequests, variants } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

const EMI_STATUSES = [
  "pending",
  "contacted",
  "approved",
  "rejected",
  "converted",
] as const;

type EmiStatus = (typeof EMI_STATUSES)[number];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const bank = searchParams.get("bank");
    const page = Number(searchParams.get("page") || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const statusParam = searchParams.get("status");

    const status = EMI_STATUSES.includes(statusParam as EmiStatus)
      ? (statusParam as EmiStatus)
      : null;

    const conditions = [];

    if (status) {
      conditions.push(eq(emiAssistRequests.status, status));
    }

    if (bank) {
      conditions.push(eq(emiAssistRequests.bankPreference, bank));
    }

    const data = await db
      .select({
        id: emiAssistRequests.id,
        name: emiAssistRequests.name,
        phone: emiAssistRequests.phone,
        email: emiAssistRequests.email,
        pan: emiAssistRequests.pan,
        price: emiAssistRequests.price,
        bank: emiAssistRequests.bankPreference,
        status: emiAssistRequests.status,
        createdAt: emiAssistRequests.createdAt,
        productName: variants.name,
      })
      .from(emiAssistRequests)
      .leftJoin(variants, eq(variants.id, emiAssistRequests.variantId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(emiAssistRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      page,
      pageSize: limit,
    });
  } catch (err) {
    console.error("Admin EMI list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch EMI requests" },
      { status: 500 }
    );
  }
}
