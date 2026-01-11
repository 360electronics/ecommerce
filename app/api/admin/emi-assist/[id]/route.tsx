import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { emiAssistRequests, variants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [lead] = await db
      .select({
        id: emiAssistRequests.id,
        name: emiAssistRequests.name,
        phone: emiAssistRequests.phone,
        email: emiAssistRequests.email,
        pan: emiAssistRequests.pan,
        price: emiAssistRequests.price,
        bank: emiAssistRequests.bankPreference,
        status: emiAssistRequests.status,
        notes: emiAssistRequests.notes,
        createdAt: emiAssistRequests.createdAt,
        productName: variants.name,
      })
      .from(emiAssistRequests)
      .leftJoin(variants, eq(variants.id, emiAssistRequests.variantId))
      .where(eq(emiAssistRequests.id, params.id));

    if (!lead) {
      return NextResponse.json(
        { error: "EMI request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (err) {
    console.error("Admin EMI get error:", err);
    return NextResponse.json(
      { error: "Failed to fetch EMI request" },
      { status: 500 }
    );
  }
}


export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, notes } = body;

    if (!status && !notes) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    await db
      .update(emiAssistRequests)
      .set({
        status: status ?? undefined,
        notes: notes ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(emiAssistRequests.id, params.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin EMI update error:", err);
    return NextResponse.json(
      { error: "Failed to update EMI request" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db
      .delete(emiAssistRequests)
      .where(eq(emiAssistRequests.id, params.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin EMI delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete EMI request" },
      { status: 500 }
    );
  }
}
