import { NextResponse } from "next/server";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";

type Params = Promise<{ id: string }>;

export async function PUT(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await db
    .update(stores)
    .set({
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
    .where(eq(stores.id, id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  await db.delete(stores).where(eq(stores.id, id));
  return NextResponse.json({ success: true });
}
