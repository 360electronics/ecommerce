import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db/drizzle'
import { products } from '@/db/schema/products/products.schema'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Query for the product with the matching slug
    const product = await db.select().from(products).where(eq(products.slug, slug)).limit(1)

    if (!product || product.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product[0], { status: 200 })
  } catch (error) {
    console.error('Error fetching product by slug:', error)
    return NextResponse.json({ message: 'Failed to fetch product' }, { status: 500 })
  }
}
