import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { products, variants, categories, subcategories, brands } from '@/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { uploadProductImageToR2, extractKeyFromR2Url, deleteFromR2 } from '@/lib/r2';

// Utility to convert numeric fields to strings for Drizzle ORM
const toNumericString = (value: number | undefined | null, defaultValue?: string): string | undefined =>
  value != null ? value.toString() : defaultValue;

// Utility to parse JSON fields safely
const parseJSONField = <T,>(
  field: string | null | undefined,
  defaultValue: T,
  isTags: boolean = false
): T => {
  if (!field) return defaultValue;
  if (isTags) {
    return field.split(',').map((tag) => tag.trim()).filter(Boolean) as T;
  }
  try {
    return JSON.parse(field) as T;
  } catch (error) {
    console.warn('Failed to parse JSON field:', { field, error });
    return defaultValue;
  }
};

// Input validation schema for POST
const createProductSchema = z.object({
  shortName: z.string().min(1).max(255),
  fullName: z.string().min(1).max(500),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  status: z.enum(['active', 'inactive', 'coming_soon', 'discontinued']).default('active'),
  isFeatured: z.boolean().default(false),
  totalStocks: z.number().int().min(0).default(0),
  deliveryMode: z.enum(['standard', 'express', 'same_day', 'pickup']).default('standard'),
  tags: z.array(z.string()).default([]),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  specifications: z
    .array(
      z.object({
        groupName: z.string(),
        fields: z.array(z.object({ fieldName: z.string(), fieldValue: z.string() })),
      })
    )
    .default([]),
  warranty: z.string().max(100).optional(),
  averageRating: z.number().min(0).max(5).default(0.0).optional(),
  ratingCount: z.number().int().min(0).default(0).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  variants: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(255),
      sku: z.string().min(1).max(100),
      slug: z.string().min(1).max(255),
      attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
      stock: z.coerce.number().int().min(0).default(0),
      lowStockThreshold: z.coerce.number().int().min(0).default(5),
      isBackorderable: z.boolean().default(false),
      mrp: z.coerce.number().positive(),
      ourPrice: z.coerce.number().positive(),
      salePrice: z.coerce.number().positive().optional(),
      isOnSale: z.boolean().default(false),
      productImages: z
        .array(
          z.object({
            url: z.string().url(),
            alt: z.string(),
            isFeatured: z.boolean(),
            displayOrder: z.number().int().min(0),
          })
        )
        .default([]),
      weight: z.coerce.number().positive().optional(),
      weightUnit: z.string().max(10).default('kg'),
      dimensions: z
        .object({
          length: z.number().positive(),
          width: z.number().positive(),
          height: z.number().positive(),
          unit: z.string(),
        })
        .optional(),
      isDefault: z.boolean().default(true),
    })
  ).min(1),
});

// Input validation schema for PATCH (bulk update)
const bulkUpdateProductSchema = z.object({
  status: z.enum(['inactive', 'discontinued']).optional(),
  delete: z.boolean().default(false),
});


// GET: Fetch all products with related data
export async function GET() {
  try {
    const allProducts = await db
      .select({
        product: products,
        category: categories,
        subcategory: subcategories,
        brand: brands,
        variants: variants,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(variants, eq(products.id, variants.productId));

    // Group variants by product
    const groupedProducts = allProducts.reduce((acc, row) => {
      const productId = row.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          ...row.product,
          category: row.category,
          subcategory: row.subcategory,
          brand: row.brand,
          variants: [],
        };
      }
      if (row.variants) {
        acc[productId].variants.push(row.variants);
      }
      return acc;
    }, {} as Record<string, any>);

    // console.log(groupedProducts)

    return NextResponse.json(Object.values(groupedProducts));
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new product with its variant and upload images to R2
export async function POST(req: NextRequest) {
  try {
    // Parse FormData
    const formData = await req.formData();

    // Fetch category, subcategory, and brand IDs
    const categorySlug = formData.get('category') as string;
    const subcategoryName = formData.get('subcategory') as string;
    const brandName = formData.get('brand') as string;

    // Query category ID by slug
    const category = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    if (!category.length) {
      return NextResponse.json({ error: `Category with slug '${categorySlug}' not found` }, { status: 400 });
    }
    const categoryId = category[0].id;

    // Query subcategory ID by name (if provided)
    let subcategoryId: string | undefined;
    if (subcategoryName) {
      const subcategory = await db
        .select({ id: subcategories.id })
        .from(subcategories)
        .where(and(eq(subcategories.name, subcategoryName), eq(subcategories.categoryId, categoryId)))
        .limit(1);
      if (!subcategory.length) {
        return NextResponse.json(
          { error: `Subcategory '${subcategoryName}' not found for category '${categorySlug}'` },
          { status: 400 }
        );
      }
      subcategoryId = subcategory[0].id;
    }

    // Query brand ID by name
    const brand = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.name, brandName))
      .limit(1);
    if (!brand.length) {
      return NextResponse.json({ error: `Brand '${brandName}' not found` }, { status: 400 });
    }
    const brandId = brand[0].id;

    // Convert FormData to a structured object with resolved IDs
    const productData = {
      shortName: formData.get('shortName') as string,
      fullName: formData.get('fullName') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      categoryId, // Use resolved UUID
      subcategoryId, // Use resolved UUID or undefined
      brandId, // Use resolved UUID
      status: (formData.get('status') as string) || 'active',
      isFeatured: formData.get('isFeatured') === 'true',
      totalStocks: parseInt(formData.get('totalStocks') as string || '0'),
      deliveryMode: (formData.get('deliveryMode') as string) || 'standard',
      tags: parseJSONField<string[]>(formData.get('tags') as string, [], true),
      warranty: formData.get('warranty') as string,
      averageRating: parseFloat(formData.get('averageRating') as string || '0'),
      ratingCount: parseInt(formData.get('ratingCount') as string || '0'),
      metaTitle: formData.get('metaTitle') as string,
      metaDescription: formData.get('metaDescription') as string,
      specifications: parseJSONField(formData.get('specifications') as string, []),
      variants: parseJSONField(formData.get('variants') as string, []),
    };

    // Validate the parsed data
    const validatedData = createProductSchema.parse(productData);

    // Check if slug already exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.slug, validatedData.slug))
      .limit(1);
    if (existingProduct.length > 0) {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 400 });
    }

    // Insert product
    const [newProduct] = await db
      .insert(products)
      .values({
        shortName: validatedData.shortName,
        fullName: validatedData.fullName,
        slug: validatedData.slug,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        subcategoryId: validatedData.subcategoryId,
        brandId: validatedData.brandId,
        status: validatedData.status,
        isFeatured: validatedData.isFeatured,
        totalStocks: toNumericString(validatedData.totalStocks, '0'),
        deliveryMode: validatedData.deliveryMode,
        tags: validatedData.tags,
        attributes: validatedData.attributes || {},
        specifications: validatedData.specifications,
        warranty: validatedData.warranty,
        averageRating: toNumericString(validatedData.averageRating, '0.0'),
        ratingCount: toNumericString(validatedData.ratingCount, '0'),
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
      })
      .returning();

    // Insert all variants and handle image uploads
    const newVariants = [];
    for (const variantData of validatedData.variants) {
      // Handle image uploads for this variant
      const uploadedImages = [];
      const imageFiles = formData.getAll(`variantImages_${variantData.sku}`) as File[];
      for (const [index, imageFile] of imageFiles.entries()) {
        if (imageFile && imageFile.size > 0) {
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          const fileName = `${variantData.sku}-${index}-${imageFile.name}`;
          const mimeType = imageFile.type;

          // Upload image to R2
          const imageUrl = await uploadProductImageToR2(
            validatedData.shortName,
            variantData.sku,
            buffer,
            mimeType,
            fileName
          );

          // Add to uploaded images array
          uploadedImages.push({
            url: imageUrl,
            alt: `Image for ${variantData.name} ${index + 1}`,
            isFeatured: index === 0,
            displayOrder: index,
          });
        }
      }

      // Use only uploaded images
      const finalProductImages = uploadedImages;

      // Insert variant with updated productImages
      const [newVariant] = await db
        .insert(variants)
        .values({
          productId: newProduct.id,
          name: variantData.name,
          sku: variantData.sku,
          slug: variantData.slug,
          attributes: variantData.attributes,
          stock: toNumericString(variantData.stock, '0') || '0',
          lowStockThreshold: toNumericString(variantData.lowStockThreshold, '5') || '5',
          isBackorderable: variantData.isBackorderable,
          mrp: toNumericString(variantData.mrp, '0') || '0',
          ourPrice: toNumericString(variantData.ourPrice, '0') || '0',
          salePrice: toNumericString(variantData.salePrice),
          isOnSale: variantData.isOnSale,
          productImages: finalProductImages,
          weight: toNumericString(variantData.weight),
          weightUnit: variantData.weightUnit,
          dimensions: variantData.dimensions,
          isDefault: variantData.isDefault,
        })
        .returning();

      newVariants.push(newVariant);
    }
    return NextResponse.json(
      {
        product: newProduct,
        variants: newVariants,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete all products and their images from R2
export async function DELETE() {
  try {
    // Fetch all variants to get image URLs
    const allVariants = await db.select({ productImages: variants.productImages }).from(variants);

    // Delete R2 images
    const deletePromises = allVariants.flatMap((variant) =>
      (variant.productImages as { url: string; alt: string; isFeatured: boolean; displayOrder: number }[])
        .map(async (image) => {
          const key = extractKeyFromR2Url(image.url);
          if (key) {
            try {
              await deleteFromR2(key);
            } catch (error) {
              console.warn(`Failed to delete R2 image with key ${key}:`, error);
            }
          }
        })
    );

    await Promise.all(deletePromises);

    // Delete all products (cascading deletes will handle variants)
    await db.delete(products);

    return NextResponse.json({ message: 'All products and images deleted successfully' });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Bulk update or delete incomplete or inactive products
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = bulkUpdateProductSchema.parse(body);

    // Identify incomplete products (e.g., no variants or inactive status)
    const incompleteProducts = await db
      .select({ id: products.id, variants: variants.id })
      .from(products)
      .leftJoin(variants, eq(products.id, variants.productId))
      .where(
        and(
          isNull(variants.id), // No variants
          eq(products.status, 'active') // Still active
        )
      );

    if (incompleteProducts.length === 0) {
      return NextResponse.json({ message: 'No incomplete products found' });
    }

    if (validatedData.delete) {
      // Delete incomplete products and associated images
      const productIds = incompleteProducts.map((p) => p.id);
      const variantsToDelete = productIds.length
        ? await db
          .select({ productImages: variants.productImages })
          .from(variants)
          .where(inArray(variants.productId, productIds))
        : [];

      const deleteImagePromises = variantsToDelete.flatMap((variant) =>
        (variant.productImages as { url: string; alt: string; isFeatured: boolean; displayOrder: number }[])
          .map(async (image) => {
            const key = extractKeyFromR2Url(image.url);
            if (key) {
              try {
                await deleteFromR2(key);
              } catch (error) {
                console.warn(`Failed to delete R2 image with key ${key}:`, error);
              }
            }
          })
      );

      await Promise.all(deleteImagePromises);

      // Delete products
      await db.delete(products).where(inArray(products.id, productIds));

      return NextResponse.json({
        message: `${incompleteProducts.length} incomplete products deleted`,
      });
    } else {
      // Update status of incomplete products
      await db
        .update(products)
        .set({ status: validatedData.status || 'inactive', updatedAt: new Date() })
        .where(inArray(products.id, incompleteProducts.map((p) => p.id)));

      return NextResponse.json({
        message: `${incompleteProducts.length} incomplete products updated to ${validatedData.status || 'inactive'}`,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}