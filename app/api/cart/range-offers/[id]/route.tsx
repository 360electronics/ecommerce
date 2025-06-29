import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { cart_offer_products } from '@/db/schema';

type Params = Promise<{ id: string; }>;

// DELETE: Remove a cart offer product by ID
export async function DELETE(request: Request, { params }: {params :Params}) {
  try {
    const { id } = await params;
    const [deletedProduct] = await db
      .delete(cart_offer_products)
      .where(eq(cart_offer_products.id, id))
      .returning();

    if (!deletedProduct) {
      return NextResponse.json(
        { error: 'Cart offer product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Cart offer product deleted successfully' });
  } catch (error) {
    console.error('Error deleting cart offer product:', error);
    return NextResponse.json(
      { error: 'Failed to delete cart offer product' },
      { status: 500 }
    );
  }
}