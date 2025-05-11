import { gamersZone, products } from "@/db/schema/products/products.schema"
import { db } from "@/db/drizzle"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"


export async function GET() {
  try {
    // Get all gamers zone entries
    const gamerZoneEntries = await db.select().from(gamersZone);
    
    // Group the entries by category
    const categorizedEntries = gamerZoneEntries.reduce((acc, entry) => {
      const category = entry.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(entry);
      return acc;
    }, {} as Record<string, typeof gamerZoneEntries>);
    
    // Fetch full product data for each category
    const result: Record<string, any[]> = {};
    
    // Process each category
    for (const [category, entries] of Object.entries(categorizedEntries)) {
      const categoryProducts = await Promise.all(
        entries.map(async (item) => {
          const [product] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          
          // Add the category to the product
          return product ? { ...product, category } : null;
        })
      );
      
      // Filter out null results
      result[category] = categoryProducts.filter(Boolean);
    }
    
    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching gamers zone products:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch gamers zone products' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}


export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    
    // Extract categorized product IDs from request
    // Expecting something like { categories: { laptops: [id1, id2], consoles: [id3, id4], ... } }
    const { categories } = body;
    
    // Validate input
    if (!categories || typeof categories !== 'object') {
      return NextResponse.json(
        { message: 'Invalid request. Expected categories object with product IDs' },
        { status: 400 }
      );
    }
    
    // Delete existing entries
    await db.delete(gamersZone);
    
    // Prepare bulk insert values
    const insertValues:any[] = [];
    
    // Process each category
    for (const [category, productIds] of Object.entries(categories)) {
      // Validate that productIds is an array
      if (!Array.isArray(productIds)) {
        continue; // Skip invalid entries
      }
      
      // Only allow valid categories
      if (!['laptops', 'consoles', 'accessories', 'steering-chairs'].includes(category)) {
        continue; // Skip invalid categories
      }
      
      // Add each product ID with its category
      productIds.forEach(productId => {
        insertValues.push({
          productId,
          category,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }
    
    // Perform bulk insert if there are valid entries
    if (insertValues.length > 0) {
      const result = await db.insert(gamersZone).values(insertValues);
      
      return NextResponse.json({
        message: 'Gamers Zone updated successfully',
        count: insertValues.length,
        result
      }, { status: 200 });
    } else {
      return NextResponse.json({
        message: 'No valid entries to insert',
      }, { status: 200 });
    }
    
  } catch (error) {
    console.error('Error updating gamers zone:', error);
    return NextResponse.json(
      { message: 'Failed to update gamers zone' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a specific product from featured
export async function DELETE(req: Request) {
    try {
      const body = await req.json();
      const { productId } = body;
  
      if (!productId) {
        return NextResponse.json(
          { message: 'Product ID is required' },
          { status: 400 }
        );
      }
  
      const result = await db
        .delete(gamersZone)
        .where(eq(gamersZone.productId, productId)); // Correct usage
  
      return NextResponse.json(
        {
          message: 'Product removed from new arrivals products',
          result,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error removing product from new arrivals:', error);
      return NextResponse.json(
        { message: 'Failed to remove product from new arrivals' },
        { status: 500 }
      );
    }
  }