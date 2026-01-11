import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { emiAssistRequests } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      email,
      pan,
      productId,
      variantId,
      price,
      bankPreference,
    } = body;

    /* ---------------- Validation ---------------- */
    if (!name || !phone || !productId || !variantId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid PAN format" },
        { status: 400 }
      );
    }

    /* ---------------- Insert ---------------- */
    await db.insert(emiAssistRequests).values({
      name: name.trim(),
      phone,
      email: email?.trim() || null,
      pan: pan?.toUpperCase() || null,
      productId,
      variantId,
      price,
      bankPreference: bankPreference || null,
    });

    return NextResponse.json({
      success: true,
      message: "EMI assistance request submitted",
    });
  } catch (err) {
    console.error("EMI Assist Error:", err);
    return NextResponse.json(
      { error: "Failed to submit EMI request" },
      { status: 500 }
    );
  }
}
