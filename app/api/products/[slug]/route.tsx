// app/api/variants/[slug]/route.ts
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { brands, categories, products, subcategories, variants } from '@/db/schema';

type Params = { slug: string };


export async function GET(
  request: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { slug } = await context.params;

    // Fetch the variant and associated product data
    const variantData = await db
      .select({
        product: products,
        variant: variants,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
        subcategory: {
          id: subcategories.id,
          name: subcategories.name,
          slug: subcategories.slug,
        },
        brand: {
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
        },
      })
      .from(variants)
      .innerJoin(products, eq(variants.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(subcategories, eq(products.subcategoryId, subcategories.id))
      .where(eq(variants.slug, slug))
      .limit(1);

    if (!variantData.length) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const { product, variant, category, subcategory, brand } = variantData[0];

    // Fetch all variants for the product
    const allVariants = await db
      .select()
      .from(variants)
      .where(eq(variants.productId, product.id));

    const flattenedProduct: any = {
      id: variant.id,
      productId: product.id,
      name: variant.name,
      mrp: Number(variant.mrp),
      ourPrice: Number(variant.ourPrice),
      stock: Number(variant.stock),
      slug: variant.slug,
      productImages: variant.productImages || [],
      sku: variant.sku,
      dimensions: variant.dimensions
        ? `${variant.dimensions.length}x${variant.dimensions.width}x${variant.dimensions.height} ${variant.dimensions.unit}`
        : undefined,
      weight: variant.weight ? `${variant.weight} ${variant.weightUnit}` : undefined,
      attributes: variant.attributes,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: category.name,
      brand: brand.name,
      averageRating: Number(product.averageRating),
      totalStocks: Number(product.totalStocks),
      tags: product.tags,
      description: product.description,
      productParent: {
        id: product.id,
        shortName: product.shortName,
        fullName: product.fullName,
        slug: product.slug,
        description: product.description,
        category: category.name, 
        subcategory: subcategory.name, // Adjust based on actual subcategory data
        brand: brand.name, 
        status: product.status,
        isFeatured: product.isFeatured,
        totalStocks: Number(product.totalStocks),
        deliveryMode: product.deliveryMode,
        tags: product.tags,
        specifications: product.specifications,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        averageRating: Number(product.averageRating),
        ratingCount: Number(product.ratingCount),
        variants: allVariants.map((v) => ({
          id: v.id,
          productId: v.productId,
          name: v.name,
          sku: v.sku,
          slug: v.slug,
          attributes: v.attributes,
          stock: Number(v.stock),
          lowStockThreshold: Number(v.lowStockThreshold),
          isBackorderable: v.isBackorderable,
          mrp: Number(v.mrp),
          ourPrice: Number(v.ourPrice),
          salePrice: v.salePrice ? Number(v.salePrice) : undefined,
          isOnSale: v.isOnSale,
          productImages: v.productImages || [],
          isDefault: v.isDefault,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        })),
        relatedProducts: [], 
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        hasMultipleVariants: allVariants.length > 1,
        priceRange:
          allVariants.length > 0
            ? {
                min: Math.min(...allVariants.map((v) => Number(v.ourPrice))),
                max: Math.max(...allVariants.map((v) => Number(v.ourPrice))),
              }
            : null,
        allImages: allVariants.flatMap((v) => v.productImages || []),
        isDiscontinued: product.status === 'discontinued',
        isComingSoon: product.status === 'coming_soon',
      },
    };

    return NextResponse.json(flattenedProduct);
  } catch (error) {
    console.error('Error fetching variant:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}