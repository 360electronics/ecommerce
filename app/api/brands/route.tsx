// api/brands/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { brands } from '@/db/schema';
import { nanoid } from 'nanoid';
import { db } from '@/db/drizzle';
import { uploadBrandImageToR2 } from '@/lib/r2';


export async function GET() {
  try {
    const allBrands = await db.select().from(brands);
    return NextResponse.json(allBrands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string | null;
    const isActive = formData.get('isActive') === 'true';
    const logoFile = formData.get('logo') as File | null;

    let logoUrl: string | undefined;
    if (logoFile) {
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `${nanoid(10)}-${logoFile.name}`;
      logoUrl = await uploadBrandImageToR2(buffer, logoFile.type, fileName);
    }

    const newBrand = await db
      .insert(brands)
      .values({
        name,
        slug,
        description,
        logoUrl,
        isActive,
      })
      .returning();

    return NextResponse.json(newBrand[0], { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}

