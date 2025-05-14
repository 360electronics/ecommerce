import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { checkout } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await db.delete(checkout).where(eq(checkout.userId, userId));

    return NextResponse.json({ message: 'Checkout cleared successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error clearing checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}