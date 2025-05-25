// api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { products, variants } from "@/db/schema/products/products.schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    console.log('Product id:', id)
    const formData = await req.formData();

    const shortName = formData.get('shortName') as string;
    const fullName = formData.get('fullName') as string;
    const slug = formData.get('slug') as string;
    const category = formData.get('category') as string;
    const subcategory = formData.get('subcategory') as string;
    const brand = formData.get('brand') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string;
    const isFeatured = formData.get('isFeatured') === 'true';
    const deliveryMode = formData.get('deliveryMode') as string;
    const tags = formData.get('tags') as string;
    const warranty = formData.get('warranty') as string;
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const totalStocks = parseInt(formData.get('totalStocks') as string);
    const variantsData = JSON.parse(formData.get('variants') as string);
    const specifications = JSON.parse(formData.get('specifications') as string);

    // Update product
    const updatedProduct = await db
      .update(products)
      .set({
        shortName,
        fullName,
        slug,
        category,
        subcategory,
        brand,
        description,
        status,
        isFeatured,
        deliveryMode,
        tags: tags ? tags.split(',').map((t) => t.trim()) : [],
        warranty,
        metaTitle,
        metaDescription,
        totalStocks,
        specifications,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct.length) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Delete existing variants
    await db.delete(variants).where(eq(variants.productId, id));

    // Insert new variants
    for (const variant of variantsData) {
      const variantImages = formData.getAll(`variantImages_${variant.sku}`) as File[];
      const imageUrls = variant.productImages || []; // Use existing images if provided
      // Handle new image uploads (simplified; implement your image upload logic)
      // For example, save images to a storage service and get URLs
      const newImageUrls = variantImages.length > 0 ? [] : imageUrls; // Replace with actual upload logic
      await db.insert(variants).values({
        productId: id,
        name: variant.name,
        sku: variant.sku,
        slug: variant.slug,
        attributes: variant.attributes,
        isBackorderable: variant.isBackorderable,
        mrp: parseFloat(variant.mrp),
        ourPrice: parseFloat(variant.ourPrice),
        salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
        stock: parseInt(variant.stock),
        lowStockThreshold: parseInt(variant.lowStockThreshold),
        weight: variant.weight ? parseFloat(variant.weight) : null,
        weightUnit: variant.weightUnit,
        dimensions: variant.dimensions,
        isDefault: variant.isDefault,
        productImages: newImageUrls,
      });
    }

    return NextResponse.json({ message: 'Product updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('[PRODUCT_PUT_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to update product', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}