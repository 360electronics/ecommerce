import { db } from "@/db/drizzle";
import { savedAddresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      fullName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault = false,
    } = body;

    if (!userId || !fullName || !phoneNumber || !addressLine1 || !city || !state || !postalCode || !country) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [inserted] = await db.insert(savedAddresses).values({
      userId,
      fullName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addressType: addressType || "home",
      isDefault,
    }).returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("Add address error:", err);
    return NextResponse.json({ error: "Failed to add address" }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      fullName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const updatedAddress = await db.update(savedAddresses)
      .set({
        fullName,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        addressType,
        isDefault,
      })
      .where(eq(savedAddresses.id, id))
      .returning();

    if (updatedAddress.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json(updatedAddress[0], { status: 200 });
  } catch (err) {
    console.error("Update address error:", err);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}
