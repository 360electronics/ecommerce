import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import {
  products,
  variants,
  categories,
  subcategories,
  brands,
} from "@/db/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  uploadProductImageToR2,
  extractKeyFromR2Url,
  deleteFromR2,
} from "@/lib/r2";

// Utility to convert numeric fields to strings for Drizzle ORM
const toNumericString = (
  value: number | undefined | null,
  defaultValue?: string
): string | undefined => (value != null ? value.toString() : defaultValue);

// Utility to parse JSON fields safely
const parseJSONField = <T,>(
  field: string | null | undefined,
  defaultValue: T,
  isTags: boolean = false
): T => {
  if (!field) return defaultValue;
  if (isTags) {
    return field
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) as T;
  }
  try {
    return JSON.parse(field) as T;
  } catch (error) {
    console.warn("Failed to parse JSON field:", { field, error });
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
  status: z
    .enum(["active", "inactive", "coming_soon", "discontinued"])
    .default("active"),
  isFeatured: z.boolean().default(false),
  totalStocks: z.number().int().min(0).default(0),
  deliveryMode: z.enum(["standard", "express"]).default("standard"),
  tags: z.array(z.string()).default([]),
  attributes: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
  specifications: z
    .array(
      z.object({
        groupName: z.string(),
        fields: z.array(
          z.object({ fieldName: z.string(), fieldValue: z.string() })
        ),
      })
    )
    .default([]),
  warranty: z.string().max(100).optional(),
  averageRating: z.number().min(0).max(5).default(0.0).optional(),
  ratingCount: z.number().int().min(0).default(0).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(255),
        sku: z.string().min(1).max(100),
        slug: z.string().min(1).max(255),
        attributes: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .default({}),
        stock: z.coerce.number().int().min(0).default(0),
        lowStockThreshold: z.coerce.number().int().min(0).default(5),
        isBackorderable: z.boolean().default(false),
        mrp: z.coerce.number().positive(),
        ourPrice: z.coerce.number().positive(),
        salePrice: z.coerce.number().positive().optional().nullable(),
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
        weight: z.coerce.number().nonnegative().default(0),
        weightUnit: z.string().max(10).default("kg"),
        dimensions: z
          .object({
            length: z.number().optional().default(0),
            width: z.number().optional().default(0),
            height: z.number().optional().default(0),
            unit: z.string(),
          })
          .optional(),
        isDefault: z.boolean().default(true),
      })
    )
    .min(1),
});

// Input validation schema for PATCH (delete selected products)
const bulkDeleteProductSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one product ID is required"),
});

// GET: Fetch all products with related data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const subcategorySlug = searchParams.get("subcategory");
    const brandSlug = searchParams.get("brand");
    const searchQuery = searchParams.get("q");

    const filters = [];
    if (categorySlug) filters.push(eq(categories.slug, categorySlug));
    if (subcategorySlug) filters.push(eq(subcategories.slug, subcategorySlug));
    if (brandSlug) filters.push(eq(brands.slug, brandSlug));
    if (searchQuery) {
      const search = `%${searchQuery.toLowerCase()}%`;
      filters.push(sql`LOWER(${products.fullName}) LIKE ${search}`);
    }

    const query = db
      .select({
        product: products,
        category: categories,
        subcategory: subcategories,
        brand:brands,
        variant: variants,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(variants, eq(products.id, variants.productId));

    if (filters.length > 0) {
      query.where(and(...filters));
    }

    const rows = await query;

    // Group by product ID
    const grouped = rows.reduce((acc, row) => {
      const id = row.product.id;
      if (!acc[id]) {
        acc[id] = {
          ...row.product,
          category: row.category,
          subcategory: row.subcategory,
          brand: row.brand,
          variants: [],
        };
      }
      if (row.variant) {
        acc[id].variants.push(row.variant);
      }
      return acc;
    }, {} as Record<string, any>);

    const result = Object.values(grouped);

    // Send minimal payload
    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Add a new product with its variant and upload images to R2
export async function POST(req: NextRequest) {
  try {
    // Parse FormData
    const formData = await req.formData();
    // console.log('Received FormData:', Object.fromEntries(formData));

    // Fetch category, subcategory, and brand IDs
    const categorySlug = formData.get("category") as string;
    const subcategoryName = formData.get("subcategory") as string;
    const brandName = formData.get("brand") as string;

    // Query category ID by slug
    const category = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (!category.length) {
      return NextResponse.json(
        { error: `Category with slug '${categorySlug}' not found` },
        { status: 400 }
      );
    }

    // console.log('Category of product',category)
    const categoryId = category[0].id;

    // Query subcategory ID by name (if provided)
    let subcategoryId: string | undefined;
    if (subcategoryName) {
      const subcategory = await db
        .select({ id: subcategories.id })
        .from(subcategories)
        .where(
          and(
            eq(subcategories.name, subcategoryName),
            eq(subcategories.categoryId, categoryId)
          )
        )
        .limit(1);
      if (!subcategory.length) {
        return NextResponse.json(
          {
            error: `Subcategory '${subcategoryName}' not found for category '${categorySlug}'`,
          },
          { status: 400 }
        );
      }
      subcategoryId = subcategory[0].id;
    }
    // console.log('Sub Category of product',subcategoryId)

    // Query brand ID by name
    const brand = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.name, brandName))
      .limit(1);
    if (!brand.length) {
      return NextResponse.json(
        { error: `Brand '${brandName}' not found` },
        { status: 400 }
      );
    }
    const brandId = brand[0].id;

    // console.log('Brand of product',brandId)

    const rawVariants = parseJSONField(formData.get("variants") as string, []);

    const normalizedVariants = rawVariants.map((v: any) => ({
      ...v,
      stock: v.stock ? Number(v.stock) : 0,
      lowStockThreshold: v.lowStockThreshold ? Number(v.lowStockThreshold) : 5,
      mrp: v.mrp ? Number(v.mrp) : 0,
      ourPrice: v.ourPrice ? Number(v.ourPrice) : 0,
      salePrice: v.salePrice ? Number(v.salePrice) : null,
      weight: v.weight ? Number(v.weight) : null,
    }));

    const productData = {
      shortName: formData.get("shortName") as string,
      fullName: formData.get("fullName") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      categoryId,
      subcategoryId,
      brandId,
      status: (formData.get("status") as string) || "active",
      isFeatured: formData.get("isFeatured") === "true",
      totalStocks: parseInt((formData.get("totalStocks") as string) || "0"),
      deliveryMode: (formData.get("deliveryMode") as string) || "standard",
      tags: parseJSONField<string[]>(formData.get("tags") as string, [], true),
      warranty: formData.get("warranty") as string,
      averageRating: parseFloat(
        (formData.get("averageRating") as string) || "0"
      ),
      ratingCount: parseInt((formData.get("ratingCount") as string) || "0"),
      metaTitle: formData.get("metaTitle") as string,
      metaDescription: formData.get("metaDescription") as string,
      specifications: parseJSONField(
        formData.get("specifications") as string,
        []
      ),
      variants: normalizedVariants,
    };

    // Validate the parsed data
    const validatedData = createProductSchema.parse(productData);

    // console.log("Category:", categorySlug);
    // console.log("Subcategory:", subcategoryName);
    // console.log("Brand:", brandName);
    // console.log("Validated productData:", productData);

    // Check if product slug already exists
    const existingProduct = await db
      .select({ id: products.id, slug: products.slug })
      .from(products)
      .where(eq(products.slug, validatedData.slug))
      .limit(1);
    if (existingProduct.length > 0) {
      return NextResponse.json(
        {
          error: `Product slug '${validatedData.slug}' is not unique`,
          details: `A product with slug '${validatedData.slug}' already exists in the database`,
        },
        { status: 400 }
      );
    }

    // Check if variant SKUs are unique
    const variantSkus = validatedData.variants.map((v) => v.sku);
    const existingVariants = await db
      .select({ sku: variants.sku })
      .from(variants)
      .where(inArray(variants.sku, variantSkus));
    if (existingVariants.length > 0) {
      const duplicateSkus = existingVariants.map((v) => v.sku);
      return NextResponse.json(
        {
          error: `Variant SKU(s) not unique`,
          details: `The following SKU(s) already exist in the database: ${duplicateSkus.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Check for duplicate SKUs within the request
    const uniqueSkus = new Set(variantSkus);
    if (uniqueSkus.size !== variantSkus.length) {
      return NextResponse.json(
        {
          error: `Duplicate variant SKU(s) in request`,
          details: `The variants array contains duplicate SKU(s). Each SKU must be unique within the request`,
        },
        { status: 400 }
      );
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
        totalStocks: toNumericString(validatedData.totalStocks, "0"),
        deliveryMode: validatedData.deliveryMode,
        tags: validatedData.tags,
        attributes: validatedData.attributes || {},
        specifications: validatedData.specifications,
        warranty: validatedData.warranty,
        averageRating: toNumericString(validatedData.averageRating, "0.0"),
        ratingCount: toNumericString(validatedData.ratingCount, "0"),
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
      })
      .returning();

    // Insert all variants and handle image uploads
    const newVariants = [];
    for (const variantData of validatedData.variants) {
      // Handle image uploads for this variant
      const uploadedImages = [];
      const imageFiles = formData.getAll(
        `variantImages_${variantData.sku}`
      ) as File[];
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
          stock: toNumericString(variantData.stock, "0") || "0",
          lowStockThreshold:
            toNumericString(variantData.lowStockThreshold, "5") || "5",
          isBackorderable: variantData.isBackorderable,
          mrp: toNumericString(variantData.mrp, "0") || "0",
          ourPrice: toNumericString(variantData.ourPrice, "0") || "0",
          salePrice: toNumericString(variantData.salePrice),
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
      console.error("Validation error:", error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete all products and their images from R2
export async function DELETE() {
  try {
    // Fetch all variants to get image URLs
    const allVariants = await db
      .select({ productImages: variants.productImages })
      .from(variants);

    // Delete R2 images
    const deletePromises = allVariants.flatMap((variant) =>
      (
        variant.productImages as {
          url: string;
          alt: string;
          isFeatured: boolean;
          displayOrder: number;
        }[]
      ).map(async (image) => {
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

    return NextResponse.json({
      message: "All products and images deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH: Delete selected products
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = bulkDeleteProductSchema.parse(body);

    // Check if provided product IDs exist
    const existingProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, validatedData.ids));

    const foundProductIds = existingProducts.map((p) => p.id);
    const missingIds = validatedData.ids.filter(
      (id) => !foundProductIds.includes(id)
    );

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: `The following product IDs were not found: ${missingIds.join(
            ", "
          )}`,
        },
        { status: 404 }
      );
    }

    // Delete associated images from R2
    const variantsToDelete = validatedData.ids.length
      ? await db
          .select({ productImages: variants.productImages })
          .from(variants)
          .where(inArray(variants.productId, validatedData.ids))
      : [];

    const deleteImagePromises = variantsToDelete.flatMap((variant) =>
      (
        variant.productImages as {
          url: string;
          alt: string;
          isFeatured: boolean;
          displayOrder: number;
        }[]
      ).map(async (image) => {
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

    // Delete selected products
    await db.delete(products).where(inArray(products.id, validatedData.ids));

    return NextResponse.json({
      message: `${validatedData.ids.length} selected products deleted`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error deleting products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
