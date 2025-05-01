import { newArrivals, products } from "@/db/schema/products/products.schema"
import { db } from "@/db/drizzle"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

export async function GET() {
    try {
      // Get featured product entries
      const newArrival = await db.select().from(newArrivals);
  
      // Fetch full product data by IDs
      const newArrivalsDetails = await Promise.all(
        newArrival.map(async (item) => {
          const [product] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          return product;
        })
      );
  
      return new Response(JSON.stringify(newArrivalsDetails), { status: 200 });
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      return new Response('Failed to fetch new arrivals', { status: 500 });
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
        
        await db.delete(newArrivals)
        
        // Insert each product ID as a featured product
        // This creates bulk insert values
        const insertValues = productIds.map(productId => ({
            productId: productId,
            createdAt: new Date(),
            updatedAt: new Date()
        }))
        
        // Perform bulk insert
        const result = await db.insert(newArrivals).values(insertValues)
        
        return NextResponse.json({
            message: 'New Arrivals updated successfully',
            count: productIds.length,
            result
        }, { status: 200 })
        
    } catch (error) {
        console.error('Error updating new arrivals:', error)
        return NextResponse.json(
            { message: 'Failed to update new arrivals' },
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
            .delete(newArrivals)
            .where(eq(newArrivals.productId, parseInt(productId)))
        
        return NextResponse.json({
            message: 'Product removed from new arrivals products',
            result
        }, { status: 200 })
        
    } catch (error) {
        console.error('Error removing product from new arrivals:', error)
        return NextResponse.json(
            { message: 'Failed to remove product from new arrivals' },
            { status: 500 }
        )
    }
}