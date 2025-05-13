import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { products, variants } from '@/db/schema/products/products.schema';
import { deleteFromR2, extractKeyFromR2Url, uploadProductImageToR2 } from '@/lib/r2';
import { inArray, eq } from 'drizzle-orm';


interface ErrorResponse {
  message: string;
  error: string;
}

// Define the structure for a specification group (aligned with schema)
interface SpecificationGroup {
  groupName: string;
  fields: { fieldName: string; fieldValue: string }[];
}

// Define the structure for a product with specifications and variants
interface ProductWithSpecifications {
  id: string;
  shortName: string;
  description: string | null;
  category: string;
  brand: string;
  status: 'active' | 'inactive';
  subProductStatus: 'active' | 'inactive';
  totalStocks: string;
  deliveryMode: 'standard' | 'express';
  tags: string | null;
  specifications: SpecificationGroup[];
  averageRating: string;
  ratingCount: string;
  createdAt: Date;
  updatedAt: Date;
  variants: VariantData[];
}


interface VariantData {
  id: string;
  productId: string;
  name: string;
  sku: string;
  slug: string;
  color: string;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  storage: string | null;
  stock: string;
  mrp: string;
  ourPrice: string;
  productImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ErrorResponse {
  message: string;
  error: string;
}

interface ProductResponse {
  success: boolean;
  productId: string;
  message: string;
  variantImageUrls: { [variantId: string]: string[] };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Extract product fields
    const shortName = formData.get('shortName')?.toString();
    const category = formData.get('category')?.toString();
    const brand = formData.get('brand')?.toString();
    const description = formData.get('description')?.toString() || null;
    const status = (formData.get('status')?.toString() || 'active') as 'active' | 'inactive';
    const subProductStatus = (formData.get('subProductStatus')?.toString() || 'active') as 'active' | 'inactive';
    const totalStocks = formData.get('totalStocks')?.toString();
    const deliveryMode = (formData.get('deliveryMode')?.toString() || 'standard') as 'standard' | 'express';
    const tags = formData.get('tags')?.toString() || null;
    const specificationsRaw = formData.get('specifications')?.toString() || '[]';
    const variantsRaw = formData.get('variants')?.toString();

    // Validate required product fields
    if (!shortName) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Product short name is required', error: 'Missing shortName' },
        { status: 400 }
      );
    }
    if (!category) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Category is required', error: 'Missing category' },
        { status: 400 }
      );
    }
    if (!brand) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Brand is required', error: 'Missing brand' },
        { status: 400 }
      );
    }
    if (!totalStocks || !/^\d+$/.test(totalStocks)) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Total stocks must be a valid integer', error: 'Invalid totalStocks' },
        { status: 400 }
      );
    }

    // Parse and validate specifications
    let specifications: { groupName: string; fields: { fieldName: string; fieldValue: string }[] }[];
    try {
      specifications = JSON.parse(specificationsRaw);
      if (!Array.isArray(specifications)) {
        throw new Error('Specifications must be an array');
      }
    } catch {
      return NextResponse.json<ErrorResponse>(
        { message: 'Invalid specifications format', error: 'Specifications must be valid JSON' },
        { status: 400 }
      );
    }

    // Parse and validate variants
    let variantsData: VariantData[];
    try {
      variantsData = JSON.parse(variantsRaw || '[]') as VariantData[];
      if (!Array.isArray(variantsData) || variantsData.length === 0) {
        return NextResponse.json<ErrorResponse>(
          { message: 'At least one variant is required', error: 'Missing or invalid variants' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json<ErrorResponse>(
        { message: 'Invalid variants format', error: 'Variants must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate variant fields
    for (const variant of variantsData) {
      if (!variant.name) {
        return NextResponse.json<ErrorResponse>(
          { message: 'Variant name is required', error: 'Missing variant name' },
          { status: 400 }
        );
      }
      if (!variant.sku) {
        return NextResponse.json<ErrorResponse>(
          { message: 'Variant SKU is required', error: 'Missing variant SKU' },
          { status: 400 }
        );
      }
      if (!variant.slug) {
        return NextResponse.json<ErrorResponse>(
          { message: 'Variant slug is required', error: 'Missing variant slug' },
          { status: 400 }
        );
      }
      if (!variant.color) {
        return NextResponse.json<ErrorResponse>(
          { message: 'Variant color is required', error: 'Missing variant color' },
          { status: 400 }
        );
      }
      if (!variant.mrp || !/^\d+\.\d{2}$/.test(variant.mrp)) {
        return NextResponse.json<ErrorResponse>(
          { message: 'Variant MRP must be a valid number with two decimal places', error: 'Invalid variant MRP' },
          { status: 400 }
        );
      }
      if (!variant.ourPrice || !/^\d+\.\d{2}$/.test(variant.ourPrice)) {
        return NextResponse.json<ErrorResponse>(
          { message: 'Variant Our Price must be a valid number with two decimal places', error: 'Invalid variant Our Price' },
          { status: 400 }
        );
      }
      if (!variant.stock || !/^\d+$/.test(variant.stock)) {
        return NextResponse.json<ErrorResponse>(
          { message: 'Variant stock must be a valid integer', error: 'Invalid variant stock' },
          { status: 400 }
        );
      }
      if (!variant.productImages || variant.productImages.length === 0) {
        return NextResponse.json<ErrorResponse>(
          { message: 'At least one image is required for each variant', error: 'Missing variant images' },
          { status: 400 }
        );
      }
    }

    // Validate total stocks
    const totalVariantStock = variantsData.reduce((sum, v) => sum + parseInt(v.stock), 0);
    if (totalVariantStock !== parseInt(totalStocks)) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Total stock must equal the sum of variant stocks', error: 'Stock mismatch' },
        { status: 400 }
      );
    }

    // Insert product
    const productData = {
      shortName,
      description,
      category,
      brand,
      status,
      subProductStatus,
      totalStocks, // Keep as string
      deliveryMode,
      tags,
      specifications,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [insertedProduct] = await db.insert(products).values(productData).returning();
    const productId = insertedProduct.id;

    // Process variant images and insert variants
    const variantImageUrls: { [variantId: string]: string[] } = {};
    try {
      for (const variant of variantsData) {
        const variantId = `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Temporary ID for image organization
        const uploadedImageUrls: string[] = [];

        // Upload images for the variant
        for (let i = 0; i < variant.productImages.length; i++) {
          const imageData = variant.productImages[i];
          if (imageData && imageData.startsWith('data:')) {
            const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches) {
              throw new Error(`Invalid base64 image data for variant ${variant.name}`);
            }
            const mimeType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `image-${i + 1}-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
            const imageUrl = await uploadProductImageToR2(shortName, variantId, buffer, mimeType, fileName);
            uploadedImageUrls.push(imageUrl);
          }
        }

        variantImageUrls[variantId] = uploadedImageUrls;

        // Insert variant
        const variantData = {
          productId,
          name: variant.name,
          sku: variant.sku,
          slug: variant.slug, // Added slug field
          color: variant.color,
          material: variant.material || null,
          dimensions: variant.dimensions || null,
          weight: variant.weight || null,
          storage: variant.storage || null, // Align with schema
          stock: variant.stock, // Keep as string
          mrp: variant.mrp, // Keep as string
          ourPrice: variant.ourPrice, // Keep as string
          productImages: uploadedImageUrls,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(variants).values(variantData);
      }
    } catch (error) {
      // Cleanup: Delete the inserted product if variant insertion fails
      try {
        await db.delete(products).where(eq(products.id, productId));
        console.log(`[PRODUCT_POST_CLEANUP] Deleted product ${productId} due to error`);
      } catch (cleanupError) {
        console.error(`[PRODUCT_POST_CLEANUP_ERROR] Failed to delete product ${productId}:`, cleanupError);
      }
      throw error;
    }

    return NextResponse.json<ProductResponse>({
      success: true,
      productId,
      message: 'Product created successfully',
      variantImageUrls,
    });
  } catch (error) {
    console.error('[PRODUCT_POST_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch products with their variants
    const allProducts = await db
      .select({
        product: products,
        variant: variants,
      })
      .from(products)
      .leftJoin(variants, eq(products.id, variants.productId));

    // Group by product and format specifications and variants
    const formattedProducts = allProducts.reduce((acc: Record<string, ProductWithSpecifications>, row) => {
      const productId = row.product.id;

      if (!acc[productId]) {
        acc[productId] = {
          id: row.product.id,
          shortName: row.product.shortName,
          description: row.product.description,
          category: row.product.category,
          brand: row.product.brand,
          status: row.product.status,
          subProductStatus: row.product.subProductStatus,
          totalStocks: row.product.totalStocks,
          deliveryMode: row.product.deliveryMode,
          tags: row.product.tags,
          specifications: row.product.specifications, // Directly use JSONB specifications
          averageRating: row.product.averageRating,
          ratingCount: row.product.ratingCount,
          createdAt: row.product.createdAt,
          updatedAt: row.product.updatedAt,
          variants: [],
        };
      }

      // Handle variants
      if (row.variant) {
        const variantId = row.variant.id;
        const existingVariant = acc[productId].variants.find((v) => v.id === variantId);

        if (!existingVariant) {
          acc[productId].variants.push({
            id: row.variant.id,
            productId: row.variant.productId,
            name: row.variant.name,
            sku: row.variant.sku,
            slug: row.variant.slug,
            color: row.variant.color,
            material: row.variant.material,
            dimensions: row.variant.dimensions,
            weight: row.variant.weight,
            storage: row.variant.storage,
            stock: row.variant.stock,
            mrp: row.variant.mrp,
            ourPrice: row.variant.ourPrice,
            productImages: row.variant.productImages,
            createdAt: row.variant.createdAt,
            updatedAt: row.variant.updatedAt,
          });
        }
      }

      return acc;
    }, {});

    return NextResponse.json<ProductWithSpecifications[]>(Object.values(formattedProducts), { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json<ErrorResponse>(
      { message: 'Failed to fetch products', error: String(error) },
      { status: 500 }
    );
  }
}


export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { ids }: { ids: string[] } = body;

    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: "Product IDs are required", error: "Invalid IDs" },
        { status: 400 }
      );
    }

    // Fetch variants to get image URLs
    const variantList = await db
      .select({ productImages: variants.productImages })
      .from(variants)
      .where(inArray(variants.productId, ids));

    // Delete images from R2
    for (const variant of variantList) {
      if (Array.isArray(variant.productImages)) {
        for (const url of variant.productImages) {
          const key = extractKeyFromR2Url(url);
          if (key) {
            try {
              await deleteFromR2(key);
              console.log(`Deleted R2 object with key: ${key}`);
            } catch (err) {
              console.error(`Failed to delete R2 object with key ${key}:`, err);
              // Continue with other deletions instead of failing the entire operation
            }
          }
        }
      }
    }

    // Delete products (variants are automatically deleted due to cascading delete)
    const result = await db
      .delete(products)
      .where(inArray(products.id, ids))
      .returning();

    if (result.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: "No products found to delete", error: "Invalid or non-existent product IDs" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Products and associated variant images removed successfully",
        deletedProducts: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PRODUCT_DELETE_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      {
        message: "Failed to delete products",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}