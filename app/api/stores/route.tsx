import { requireAdmin } from "@/lib/server-auth";
import { NextResponse } from "next/server";
import { stores } from "@/db/schema";
import { db } from "@/db/drizzle";

// GET all stores
export async function GET() {
  const allStores = await db.select().from(stores);
  return NextResponse.json(allStores);
}

// POST new store
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin.error) return admin.error;

  const body = await req.json();

  const inserted = await db
    .insert(stores)
    .values({
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      phone: body.phone,
      email: body.email,
      lat: body.lat ? parseFloat(body.lat) : null,
      lng: body.lng ? parseFloat(body.lng) : null,
      tags: body.tags ?? null,
      opening_hours: body.opening_hours ?? null,
    })
    .returning();

  return NextResponse.json(inserted[0]);
}
