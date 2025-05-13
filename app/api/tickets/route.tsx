import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { tickets } from '@/db/schema/tickets/ticket.schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, type, issue_desc } = body;

    if (!user_id || !type || !issue_desc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await db.insert(tickets).values({
      user_id,
      type,
      issue_desc,
    });

    return NextResponse.json({ message: 'Ticket submitted successfully', result });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
