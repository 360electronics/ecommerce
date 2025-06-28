// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { categories, attributeTemplates, subcategories } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Params = { id: string };

export async function GET(req: NextRequest, context: { params: Promise<Params> } ) {
  try {
    const { id } = await context.params;

    const categoryData = await db
      .select({
        category: categories,
        attributes: attributeTemplates.attributes,
        subcategory: subcategories,
      })
      .from(categories)
      .leftJoin(attributeTemplates, eq(categories.id, attributeTemplates.categoryId))
      .leftJoin(subcategories, eq(categories.id, subcategories.categoryId))
      .where(eq(categories.id, id));

    if (categoryData.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Group data into a single category object
    const result = categoryData.reduce(
      (acc, row) => {
        if (!acc.category) {
          acc.category = row.category;
          acc.attributes = row.attributes || [];
          acc.subcategories = [];
        }
        if (row.subcategory) {
          acc.subcategories.push({
            id: row.subcategory.id,
            name: row.subcategory.name,
            slug: row.subcategory.slug,
          });
        }
        return acc;
      },
      { category: null, attributes: [], subcategories: [] } as {
        category: any;
        attributes: any[];
        subcategories: { id: string; name: string; slug: string }[];
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}