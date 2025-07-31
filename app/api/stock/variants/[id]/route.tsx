import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { variants } from '@/db/schema';

type Params = { variantId: string };

export async function GET(
  request: Request,
  context: { params: Promise<Params> }
) {
  try {
    const {variantId} =await context.params;

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    const variant = await db
      .select({ stock: variants.stock }) 
      .from(variants)
      .where(eq(variants.id, variantId))
      .limit(1);

    if (!variant[0]) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { stock: variant[0].stock },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching variant stock:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}