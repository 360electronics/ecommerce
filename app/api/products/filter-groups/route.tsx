
import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { products, productSpecGroups } from '@/db/schema';
import { sql } from 'drizzle-orm'

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// API route handler
export async function GET() {
  try {
    // Query product groups
    const groups = await db
      .select({
        id: productSpecGroups.id,
        name: productSpecGroups.groupName,
      })
      .from(productSpecGroups);

    // Query unique values for filterable fields from active products
    const activeProducts = await db
      .select({
        category: products.category,
        brand: products.brand,
        color: products.color,
        material: products.material,
        storage: products.storage,
        ourPrice: products.ourPrice,
        averageRating: products.averageRating,
        totalStocks: products.totalStocks,
      })
      .from(products)
      .where(
        sql`${products.status} = 'active' AND ${products.subProductStatus} = 'active'`
      );

    // Extract unique values for each filterable field
    const categories = [...new Set(activeProducts.map(p => p.category).filter(Boolean))].sort();
    const brands = [...new Set(activeProducts.map(p => p.brand).filter(Boolean))].sort();
    const colors = [...new Set(activeProducts.map(p => p.color).filter(Boolean))].sort();
    const materials = [...new Set(activeProducts.map(p => p.material).filter(Boolean))].sort();
    const storages = [...new Set(activeProducts.map(p => p.storage).filter(Boolean))].sort();

    // Process ratings (1 to 5 stars, floored)
    const ratings = [...new Set(
      activeProducts
        .map(p => Math.floor(Number(p.averageRating) || 0))
        .filter(rating => rating >= 1 && rating <= 5)
    )].sort((a, b) => b - a);

    // Calculate price range
    const prices = activeProducts
      .map(p => Number(p.ourPrice))
      .filter(price => !isNaN(price) && price > 0);
    const priceRange = prices.length > 0
      ? {
          min: Math.floor(Math.min(...prices)),
          max: Math.ceil(Math.max(...prices)),
        }
      : { min: 0, max: 1000 };

    // Format response
    const response = {
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
      })),
      filters: {
        price: {
          type: 'range',
          title: 'Price',
          min: priceRange.min,
          max: priceRange.max,
          step: 10,
        },
        category: {
          type: 'checkbox',
          title: 'Categories',
          options: categories.map(value => ({
            id: value,
            label: value,
          })),
        },
        brand: {
          type: 'checkbox',
          title: 'Brands',
          options: brands.map(value => ({
            id: value,
            label: value,
          })),
        },
        color: {
          type: 'checkbox',
          title: 'Color',
          options: colors.map(value => ({
            id: value,
            label: value,
          })),
        },
        material: {
          type: 'checkbox',
          title: 'Material',
          options: materials.map(value => ({
            id: value,
            label: value,
          })),
        },
        size: {
          type: 'checkbox',
          title: 'Size',
          options: storages.map(value => ({
            id: value,
            label: value,
          })),
        },
        rating: {
          type: 'checkbox',
          title: 'Rating',
          options: ratings.map(rating => ({
            id: rating.toString(),
            label: `${rating} Star${rating > 1 ? 's' : ''} & Up`,
          })),
        },
        inStock: {
          type: 'checkbox',
          title: 'In Stock',
          options: [{
            id: 'inStock',
            label: 'Exclude out of stock',
          }],
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching filter groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}