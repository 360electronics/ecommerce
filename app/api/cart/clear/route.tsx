import { db } from '@/db/drizzle';
import { cart } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/cart/clear - Clear all items from user's cart
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Delete all cart items for the user
    await db
      .delete(cart)
      .where(eq(cart.userId, userId));

    return NextResponse.json(
      { message: 'Cart cleared successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/cart/clear:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}