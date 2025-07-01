import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { brands, categories, orderItems, products, subcategories, variants } from '@/db/schema';
import { z } from 'zod';
import { uploadProductImageToR2 } from '@/lib/r2';

type Params = { id: string };

const toNumericString = (value: number | undefined | null, defaultValue?: string): string | undefined =>
    value != null ? value.toString() : defaultValue;

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
    deliveryMode: z.enum(['standard', 'express']).default('standard'),
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

export async function GET(
    request: Request,
    context: { params: Promise<Params> }
) {
    try {
        const { id } = await context.params;

        // Fetch the product and associated data by product ID
        const productData = await db
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
            .leftJoin(variants, eq(products.id, variants.productId))
            .where(eq(products.id, id));

        if (!productData.length) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Group the results to structure the product with its variants
        const product = {
            ...productData[0].product,
            category: productData[0].category,
            subcategory: productData[0].subcategory,
            brand: productData[0].brand,
            variants: productData
                .filter(row => row.variants !== null)
                .map(row => row.variants!),
        };

        return NextResponse.json(product);

    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}


export async function PUT(req: NextRequest) {
  try {
    // Parse FormData
    const formData = await req.formData();

    // Extract product ID from the request
    const productId = formData.get('id') as string;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Fetch category, subcategory, and brand IDs
    const categorySlug = formData.get('category') as string;
    const subcategorySlug = formData.get('subcategory') as string;
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

    // Query subcategory ID by slug (if provided)
    let subcategoryId: string | undefined;
    if (subcategorySlug) {
      const subcategory = await db
        .select({ id: subcategories.id })
        .from(subcategories)
        .where(and(eq(subcategories.slug, subcategorySlug), eq(subcategories.categoryId, categoryId)))
        .limit(1);
      if (!subcategory.length) {
        return NextResponse.json(
          { error: `Subcategory with slug '${subcategorySlug}' not found for category '${categorySlug}'` },
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
      id: productId,
      shortName: formData.get('shortName') as string,
      fullName: formData.get('fullName') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      categoryId,
      subcategoryId,
      brandId,
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

    // Check if product exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!existingProduct.length) {
      return NextResponse.json({ error: `Product with ID '${productId}' not found` }, { status: 404 });
    }

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    // Fetch existing variants
    const existingVariants = await db
      .select()
      .from(variants)
      .where(eq(variants.productId, productId));

    const submittedVariantIds = validatedData.variants
      .map((v: any) => v.id)
      .filter((id: string | undefined) => id && !id.startsWith('variant-'));

    // Check for variants with dependent order_items
    const variantsToDelete = existingVariants.filter((v) => !submittedVariantIds.includes(v.id));
    const nonDeletableVariants: string[] = [];

    if (variantsToDelete.length > 0) {
      // Query order_items to check for dependencies
      const orderItemss = await db
        .select({ variantId: orderItems.variantId })
        .from(orderItems)
        .where(
          inArray(
            orderItems.variantId,
            variantsToDelete.map((v) => v.id)
          )
        );

      const dependentVariantIds = new Set(orderItemss.map((item) => item.variantId));

      // Filter out variants that cannot be deleted
      for (const variant of variantsToDelete) {
        if (dependentVariantIds.has(variant.id)) {
          nonDeletableVariants.push(variant.id);
        } else {
          // Delete variants that have no dependencies
          await db.delete(variants).where(eq(variants.id, variant.id));
        }
      }
    }

    // Process variants
    const updatedVariants = [];
    for (const variantData of validatedData.variants) {
      // Handle image uploads for this variant
      const uploadedImages = [];
      const imageFiles = Array.from(formData.entries())
        .filter(([key]) => key.startsWith(`variantImages_${variantData.sku}_`))
        .map(([, file]) => file as File);
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

          uploadedImages.push({
            url: imageUrl,
            alt: `Image for ${variantData.name} ${index + 1}`,
            isFeatured: index === 0,
            displayOrder: index,
          });
        }
      }

      // Merge existing images with new uploads
      const existingImages = Array.isArray(variantData.productImages) ? variantData.productImages : [];
      const finalProductImages = [...existingImages, ...uploadedImages];

      if (variantData.id && !variantData.id.startsWith('variant-')) {
        // Update existing variant
        const [updatedVariant] = await db
          .update(variants)
          .set({
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
            updatedAt: new Date(),
          })
          .where(eq(variants.id, variantData.id))
          .returning();
        updatedVariants.push(updatedVariant);
      } else {
        // Insert new variant
        const [newVariant] = await db
          .insert(variants)
          .values({
            productId: productId,
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
        updatedVariants.push(newVariant);
      }
    }

    // Return response with warning if some variants couldn't be deleted
    if (nonDeletableVariants.length > 0) {
      return NextResponse.json(
        {
          product: updatedProduct,
          variants: updatedVariants,
          warning: `Some variants could not be deleted because they are referenced in existing orders: ${nonDeletableVariants.join(', ')}`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        product: updatedProduct,
        variants: updatedVariants,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating product:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}