import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { products, variants, categories, subcategories, brands } from '@/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { uploadProductImageToR2, extractKeyFromR2Url, deleteFromR2 } from '@/lib/r2';
import formidable from 'formidable';
import { IncomingMessage } from 'http';
import { Buffer } from 'buffer';
import fs from 'fs/promises';

// Configure formidable for parsing multipart/form-data
const form = formidable({ multiples: true, maxFileSize: 10 * 1024 * 1024 }); // 10MB limit

// Parse FormData with formidable
const parseForm = (req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    form.parse(req as unknown as IncomingMessage, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

// Utility to convert numeric fields to strings for Drizzle ORM
const toNumericString = (value: number | undefined | null, defaultValue?: string): string | undefined =>
  value != null ? value.toString() : defaultValue;

// Utility to parse JSON fields safely, avoiding JSX ambiguity
const parseJSONField = (field: string | string[] | undefined, defaultValue: any = {}): any => {
  try {
    const value = Array.isArray(field) ? field[0] : field || JSON.stringify(defaultValue);
    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse JSON field:', error);
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
  variant: z.object({
    name: z.string().min(1).max(255),
    sku: z.string().min(1).max(100),
    slug: z.string().min(1).max(255),
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
    stock: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).default(5),
    isBackorderable: z.boolean().default(false),
    mrp: z.number().positive(),
    ourPrice: z.number().positive(),
    salePrice: z.number().positive().optional(),
    isOnSale: z.boolean().default(false),
    productImages: z
      .array(
        z.object({
          fileName: z.string().regex(/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i, 'Invalid file name'),
          mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
          alt: z.string().max(255),
          isFeatured: z.boolean(),
          displayOrder: z.number().int().min(0),
        })
      )
      .default([]),
    weight: z.number().positive().optional(),
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
  }),
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

    return NextResponse.json(Object.values(groupedProducts));
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new product with its variant and upload images to R2
export async function POST(req: NextRequest) {
  try {
    // Parse multipart/form-data
    const { fields, files } = await parseForm(req);

    // Convert fields to appropriate types
    const parseField = (field: string | string[] | undefined): string =>
      Array.isArray(field) ? field[0] : field || '';

    // Construct product data
    const productData = {
      shortName: parseField(fields.shortName),
      fullName: parseField(fields.fullName),
      slug: parseField(fields.slug),
      description: fields.description ? parseField(fields.description) : undefined,
      categoryId: parseField(fields.categoryId),
      subcategoryId: fields.subcategoryId ? parseField(fields.subcategoryId) : undefined,
      brandId: parseField(fields.brandId),
      status: parseField(fields.status || 'active') as
        | 'active'
        | 'inactive'
        | 'coming_soon'
        | 'discontinued',
      isFeatured: parseField(fields.isFeatured || 'false') === 'true',
      totalStocks: parseInt(parseField(fields.totalStocks || '0')),
      deliveryMode: parseField(fields.deliveryMode || 'standard') as
        | 'standard'
        | 'express'
        | 'same_day'
        | 'pickup',
      tags: parseJSONField(fields.tags, []) as string[],
      attributes: parseJSONField(fields.attributes, {}) as Record<string, string | number | boolean>,
      specifications: parseJSONField(fields.specifications, []) as {
        groupName: string;
        fields: { fieldName: string; fieldValue: string }[];
      }[],
      warranty: fields.warranty ? parseField(fields.warranty) : undefined,
      averageRating: fields.averageRating
        ? parseFloat(parseField(fields.averageRating))
        : undefined,
      ratingCount: fields.ratingCount ? parseInt(parseField(fields.ratingCount)) : undefined,
      metaTitle: fields.metaTitle ? parseField(fields.metaTitle) : undefined,
      metaDescription: fields.metaDescription ? parseField(fields.metaDescription) : undefined,
      variant: {
        name: parseField(fields['variant.name']),
        sku: parseField(fields['variant.sku']),
        slug: parseField(fields['variant.slug']),
        attributes: parseJSONField(fields['variant.attributes'], {}) as Record<
          string,
          string | number | boolean
        >,
        stock: parseInt(parseField(fields['variant.stock'] || '0')),
        lowStockThreshold: parseInt(parseField(fields['variant.lowStockThreshold'] || '5')),
        isBackorderable: parseField(fields['variant.isBackorderable'] || 'false') === 'true',
        mrp: parseFloat(parseField(fields['variant.mrp'])),
        ourPrice: parseFloat(parseField(fields['variant.ourPrice'])),
        salePrice: fields['variant.salePrice']
          ? parseFloat(parseField(fields['variant.salePrice']))
          : undefined,
        isOnSale: parseField(fields['variant.isOnSale'] || 'false') === 'true',
        productImages: parseJSONField(fields['variant.productImages'], []) as {
          fileName: string;
          mimeType: string;
          alt: string;
          isFeatured: boolean;
          displayOrder: number;
        }[],
        weight: fields['variant.weight']
          ? parseFloat(parseField(fields['variant.weight']))
          : undefined,
        weightUnit: parseField(fields['variant.weightUnit'] || 'kg'),
        dimensions: parseJSONField(fields['variant.dimensions'], undefined) as
          | { length: number; width: number; height: number; unit: string }
          | undefined,
        isDefault: parseField(fields['variant.isDefault'] || 'true') === 'true',
      },
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

    // Upload images to R2 and track for potential cleanup
    const tempVariantId = 'temp-' + Date.now().toString();
    const uploadedImages: { url: string; alt: string; isFeatured: boolean; displayOrder: number }[] = [];

    try {
      for (const [index, image] of validatedData.variant.productImages.entries()) {
        const file = files[`variant.productImages[${index}].file`];
        if (!file) {
          throw new Error(`No file provided for image at index ${index}`);
        }
        const fileData = Array.isArray(file) ? file[0] : file;
        const buffer = await fs.readFile(fileData.filepath);

        const url = await uploadProductImageToR2(
          validatedData.shortName,
          tempVariantId,
          buffer,
          image.mimeType,
          image.fileName
        );

        uploadedImages.push({
          url,
          alt: image.alt,
          isFeatured: image.isFeatured,
          displayOrder: image.displayOrder,
        });
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
          attributes: validatedData.attributes,
          specifications: validatedData.specifications,
          warranty: validatedData.warranty,
          averageRating: toNumericString(validatedData.averageRating, '0.0'),
          ratingCount: toNumericString(validatedData.ratingCount, '0'),
          metaTitle: validatedData.metaTitle,
          metaDescription: validatedData.metaDescription,
        })
        .returning();

      // Insert variant - using the newly created product's ID
      const [newVariant] = await db
        .insert(variants)
        .values({
          productId: newProduct.id, // Use the ID from the newly created product
          name: validatedData.variant.name,
          sku: validatedData.variant.sku,
          slug: validatedData.variant.slug,
          attributes: validatedData.variant.attributes,
          stock: toNumericString(validatedData.variant.stock, '0') || '0',
          lowStockThreshold: toNumericString(validatedData.variant.lowStockThreshold, '5') || '5',
          isBackorderable: validatedData.variant.isBackorderable,
          mrp: toNumericString(validatedData.variant.mrp, '0') || '0',
          ourPrice: toNumericString(validatedData.variant.ourPrice, '0') || '0',
          salePrice: toNumericString(validatedData.variant.salePrice),
          isOnSale: validatedData.variant.isOnSale,
          productImages: uploadedImages,
          weight: toNumericString(validatedData.variant.weight),
          weightUnit: validatedData.variant.weightUnit,
          dimensions: validatedData.variant.dimensions,
          isDefault: validatedData.variant.isDefault,
        })
        .returning();

      return NextResponse.json({ product: newProduct, variant: newVariant }, { status: 201 });
    } catch (error) {
      // Clean up uploaded images on failure
      for (const image of uploadedImages) {
        const key = extractKeyFromR2Url(image.url);
        if (key) {
          await deleteFromR2(key).catch((err) =>
            console.warn(`Failed to delete R2 image ${key} during cleanup:`, err)
          );
        }
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('No file provided')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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