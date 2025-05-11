//api/products/single/[id]/route.tsx

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'

type Params = Promise<{id: string}>;

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { message: 'Product ID is required' },
        { status: 400 }
      )
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return NextResponse.json(
      { message: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
