import { requireAdmin } from "@/lib/server-auth";
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { NextResponse } from "next/server"

// GET route to fetch all users
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

    try {
      // Fetch all users from the database
      const allUsers = await db.select().from(users)
  
      return NextResponse.json(allUsers, { status: 200 })
    } catch (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 })
    }
  }