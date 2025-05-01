import { products } from "@/db/schema/products/products.schema"
import { db } from "@/db/drizzle"
import { NextResponse } from "next/server"
import { featuredProducts } from "@/db/schema/products/products.schema"
import { eq } from "drizzle-orm"

export async function GET() {
    try {
      // Get featured product entries
      const featured = await db.select().from(featuredProducts);
  
      // Fetch full product data by IDs
      const featuredProductDetails = await Promise.all(
        featured.map(async (item) => {
          const [product] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          return product;
        })
      );
  
      return new Response(JSON.stringify(featuredProductDetails), { status: 200 });
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return new Response('Failed to fetch featured products', { status: 500 });
    }
  }

export async function POST(req: Request) {
    try {
        // Parse the request body
        const body = await req.json()
        
        // Extract product IDs from request
        // Expecting something like { productIds: [1, 2, 3] }
        const { productIds } = body
        
        // Validate input
        if (!productIds || !Array.isArray(productIds)) {
            return NextResponse.json(
                { message: 'Invalid request. Expected array of product IDs' },
                { status: 400 }
            )
        }
        
        await db.delete(featuredProducts)
        
        
        // Insert each product ID as a featured product
        // This creates bulk insert values
        const insertValues = productIds.map(productId => ({
            productId: productId,
            createdAt: new Date(),
            updatedAt: new Date()
        }))
        
        // Perform bulk insert
        const result = await db.insert(featuredProducts).values(insertValues)
        
        return NextResponse.json({
            message: 'Featured products updated successfully',
            count: productIds.length,
            result
        }, { status: 200 })
        
    } catch (error) {
        console.error('Error updating featured products:', error)
        return NextResponse.json(
            { message: 'Failed to update featured products' },
            { status: 500 }
        )
    }
}

// DELETE endpoint to remove a specific product from featured
export async function DELETE(req: Request) {
    try {

        const body = await req.json()

        const { productId } = body
        
        if (!productId) {
            return NextResponse.json(
                { message: 'Product ID is required' },
                { status: 400 }
            )
        }
        
        // Remove the product from featured products
        const result = await db
            .delete(featuredProducts)
            .where(eq(featuredProducts.productId, parseInt(productId)))
        
        return NextResponse.json({
            message: 'Product removed from featured products',
            result
        }, { status: 200 })
        
    } catch (error) {
        console.error('Error removing product from featured:', error)
        return NextResponse.json(
            { message: 'Failed to remove product from featured' },
            { status: 500 }
        )
    }
}