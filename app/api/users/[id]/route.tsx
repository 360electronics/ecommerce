import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { savedAddresses, users } from "@/db/schema";

type Params = Promise<{id: string}>;


export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {

  const { id } = await params;

  const userId = id;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Get user by ID
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get saved addresses for the user
    const addressResult = await db
      .select()
      .from(savedAddresses)
      .where(eq(savedAddresses.userId, userId));

    return NextResponse.json(
      {
        user,
        addresses: addressResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_USER_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
