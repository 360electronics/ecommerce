import { requireUser } from "@/lib/server-auth";
import { db } from "@/db/drizzle";
import { savedAddresses } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const auth = await requireUser(req, userId);
    if (auth.error) return auth.error;

    const addresses = await db
      .select()
      .from(savedAddresses)
      .where(eq(savedAddresses.userId, userId));

    return NextResponse.json(addresses, { status: 200 });
  } catch (err) {
    console.error("Fetch addresses error:", err);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

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

    const auth = await requireUser(req, userId);
    if (auth.error) return auth.error;

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

    const auth = await requireUser(req);
    if (auth.error) return auth.error;

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
      // Only the owner's address can be updated
      .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, auth.user.userId)))
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
