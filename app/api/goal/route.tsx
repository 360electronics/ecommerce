import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { goals } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [goal] = await db.select().from(goals).limit(1).orderBy(desc(goals.updatedAt));
    return NextResponse.json({ goal: goal?.amount || null });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid goal amount' }, { status: 400 });
    }

    const [newGoal] = await db
      .insert(goals)
      .values({ amount })
      .returning();
    
    return NextResponse.json({ goal: newGoal.amount });
  } catch (error) {
    console.error('Error setting goal:', error);
    return NextResponse.json({ error: 'Failed to set goal' }, { status: 500 });
  }
}