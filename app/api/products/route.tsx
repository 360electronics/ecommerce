import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { products, productSpecGroups, productGroupMappings, productSpecFields } from '@/db/schema/products/products.schema';
import { deleteFromR2, extractKeyFromR2Url, uploadProductImageToR2 } from '@/lib/r2';
import { inArray, eq } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';


// Define response types
interface ProductResponse {
  success: boolean;
  productId: string;
  message: string;
  imageUrls: string[];
}

interface ErrorResponse {
  message: string;
  error: string;
}

// Define specification group response type
interface SpecificationGroup {
  id: string;
  groupName: string;
  fields: { fieldName: string; fieldValue: string }[];
}

// Define product with specifications
interface ProductWithSpecifications extends InferInsertModel<typeof products> {
  specifications: SpecificationGroup[];
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Extract and validate form data
    const name = formData.get('name')?.toString() || '';
    const slug = formData.get('slug')?.toString() || '';
    const description = formData.get('description')?.toString() || '';
    const category = formData.get('category')?.toString() || '';
    const brand = formData.get('brand')?.toString() || '';
    const color = formData.get('color')?.toString() || '';
    const tagsRaw = formData.get('tags')?.toString() || '';
    const mrp = formData.get('mrp')?.toString() || '';
    const ourPrice = formData.get('ourPrice')?.toString() || '';
    const totalStocks = formData.get('totalStocks')?.toString() || '';
    const deliveryMode = (formData.get('deliveryMode')?.toString() || 'standard') as 'standard' | 'express';
    const sku = formData.get('sku')?.toString() || '';
    const status = (formData.get('status')?.toString() || 'active') as 'active' | 'inactive';
    const subProductStatus = (formData.get('subProductStatus')?.toString() || 'active') as 'active' | 'inactive';

    // Keep tags as a comma-separated string to match the schema
    const tags = tagsRaw;

    // Validate required fields
    if (!name) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Product name is required', error: 'Missing name' },
        { status: 400 }
      );
    }

    if (!brand) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Brand is required', error: 'Missing brand' },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Color is required', error: 'Missing color' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Category is required', error: 'Missing category' },
        { status: 400 }
      );
    }

    if (!sku) {
      return NextResponse.json<ErrorResponse>(
        { message: 'SKU is required', error: 'Missing SKU' },
        { status: 400 }
      );
    }

    // Validate number fields
    if (!mrp) {
      return NextResponse.json<ErrorResponse>(
        { message: 'MRP is required', error: 'Missing MRP' },
        { status: 400 }
      );
    }
    if (!/^\d+\.\d{2}$/.test(mrp)) {
      return NextResponse.json<ErrorResponse>(
        { message: 'MRP must be a valid number with two decimal places (e.g., 99.99)', error: 'Invalid MRP' },
        { status: 400 }
      );
    }

    if (!ourPrice) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Our Price is required', error: 'Missing Our Price' },
        { status: 400 }
      );
    }
    

    if (!totalStocks) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Total Stocks is required', error: 'Missing Total Stocks' },
        { status: 400 }
      );
    }
    if (!/^\d+$/.test(totalStocks)) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Total Stocks must be a valid integer', error: 'Invalid Total Stocks' },
        { status: 400 }
      );
    }

    const specifications = JSON.parse(formData.get('specifications')?.toString() || '[]') as {
      groupName: string;
      fields: { fieldName: string; fieldValue: string }[];
    }[];

    const files = formData.getAll('productImages') as File[];

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Product images are required', error: 'Missing images' },
        { status: 400 }
      );
    }

    const validFiles = files.filter((file): file is File => file instanceof File && file.size > 0);

    if (validFiles.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: 'No valid files found to upload', error: 'Invalid files' },
        { status: 400 }
      );
    }

    // Upload images to R2
    const uploadedImageUrls = await Promise.all(
      validFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return await uploadProductImageToR2(name, buffer, file.type, file.name);
      })
    );

    // Prepare product data
    // Update the productData object in your POST handler
    const productData: InferInsertModel<typeof products> = {
      name,
      slug,
      description,
      category,
      brand,
      color,
      weight: formData.get('weight')?.toString() || null,
      dimensions: formData.get('dimensions')?.toString() || null,
      material: formData.get('material')?.toString() || null,
      storage: formData.get('storage')?.toString() || null, 
      tags,
      mrp,
      ourPrice,
      deliveryMode,
      sku,
      status,
      subProductStatus,
      totalStocks,
      productImages: uploadedImageUrls,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert product
    const [insertedProduct] = await db.insert(products).values(productData).returning();
    const productId = insertedProduct.id;

    // Handle specifications
    for (const specGroup of specifications) {
      const { groupName, fields } = specGroup;

      if (!groupName || !fields?.length) continue;

      // Check if groupName exists
      const [existingGroup] = await db
        .select()
        .from(productSpecGroups)
        .where(eq(productSpecGroups.groupName, groupName));

      let groupId: string;

      if (!existingGroup) {
        // Create new group
        const [newGroup] = await db
          .insert(productSpecGroups)
          .values({ groupName })
          .returning();
        groupId = newGroup.id;
      } else {
        groupId = existingGroup.id;
      }

      // Link product to group
      await db
        .insert(productGroupMappings)
        .values({ productId, groupId })
        .onConflictDoNothing();

      // Insert specification fields
      const fieldValues = fields.map((field) => ({
        groupId,
        productId,
        fieldName: field.fieldName,
        fieldValue: field.fieldValue,
      }));

      await db.insert(productSpecFields).values(fieldValues);
    }

    return NextResponse.json<ProductResponse>({
      success: true,
      productId,
      message: 'Product created successfully',
      imageUrls: uploadedImageUrls,
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
    // Fetch products with specifications
    const allProducts = await db
      .select({
        product: products,
        group: productSpecGroups,
        field: productSpecFields,
      })
      .from(products)
      .leftJoin(
        productGroupMappings,
        eq(products.id, productGroupMappings.productId)
      )
      .leftJoin(
        productSpecGroups,
        eq(productGroupMappings.groupId, productSpecGroups.id)
      )
      .leftJoin(
        productSpecFields,
        eq(productSpecGroups.id, productSpecFields.groupId)
      );

    // Group by product and format specifications
    const formattedProducts = allProducts.reduce((acc: Record<string, ProductWithSpecifications>, row) => {
      const productId = row.product.id;

      if (!acc[productId]) {
        acc[productId] = {
          ...row.product,
          specifications: [],
        };
      }

      if (row.group && row.field) {
        const groupId = row.group.id;
        const existingGroup = acc[productId].specifications.find((g) => g.id === groupId);

        if (!existingGroup) {
          acc[productId].specifications.push({
            id: groupId,
            groupName: row.group.groupName,
            fields: [
              {
                fieldName: row.field.fieldName,
                fieldValue: row.field.fieldValue,
              },
            ],
          });
        } else {
          existingGroup.fields.push({
            fieldName: row.field.fieldName,
            fieldValue: row.field.fieldValue,
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

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Product IDs are required', error: 'Invalid IDs' },
        { status: 400 }
      );
    }

    // Fetch products to get image URLs
    const productList = await db
      .select({ productImages: products.productImages })
      .from(products)
      .where(inArray(products.id, ids));

    // Delete images from R2
    for (const product of productList) {
      if (Array.isArray(product.productImages)) {
        for (const url of product.productImages) {
          const key = extractKeyFromR2Url(url);
          if (key) {
            try {
              await deleteFromR2(key);
            } catch (err) {
              console.error(`Failed to delete R2 object with key ${key}:`, err);
            }
          }
        }
      }
    }

    // Delete products
    const result = await db
      .delete(products)
      .where(inArray(products.id, ids))
      .returning();

    return NextResponse.json({
      message: 'Products and associated images removed successfully',
      result,
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json<ErrorResponse>(
      { message: 'Failed to delete products', error: String(error) },
      { status: 500 }
    );
  }
}