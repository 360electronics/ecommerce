import { db } from '@/db/drizzle'; 
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { wishlists } from '@/db/schema';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const wishlistedProducts = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, userId))  
      .orderBy(wishlists.createdAt);  

    if (wishlistedProducts.length === 0) {
      console.log('No products found in wishlist for the user.');
      return NextResponse.json({ message: 'No products found in wishlist' }, { status: 404 });
    }

    return NextResponse.json(wishlistedProducts); 
  } catch (error) {
    console.error('Error fetching products in wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch products in wishlist' }, { status: 500 });
  }
}