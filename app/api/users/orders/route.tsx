import { db } from '@/db/drizzle';  
import { orders } from '@/db/schema'; 
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))  
      .orderBy(orders.createdAt);  

    if (userOrders.length === 0) {
      console.log('No orders found for the user.');
      return NextResponse.json({ message: 'No orders found' }, { status: 404 });
    }

    return NextResponse.json(userOrders); 
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}