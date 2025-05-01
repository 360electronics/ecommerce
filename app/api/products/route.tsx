import { db } from '@/db/drizzle';
import { products, productSpecFields, productSpecGroups } from '@/db/schema/products/products.schema';
import { NextResponse } from 'next/server';
import { deleteFromR2, extractKeyFromR2Url, uploadProductImageToR2 } from "@/lib/r2";
import { eq, inArray } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string || "";
    const category = formData.get("category") as string;
    const mrp = parseFloat(formData.get("mrp") as string);
    const ourPrice = parseFloat(formData.get("ourPrice") as string);
    const deliveryMode = formData.get("deliveryMode") as string;
    const sku = formData.get("sku") as string || "";
    const status = formData.get("status") as string;
    const subProductStatus = formData.get("subProductStatus") as string;
    const totalStocks = parseInt(formData.get("totalStocks") as string);
    const specifications = JSON.parse(formData.get("specifications") as string);

    // Get all files from formData
    const files = formData.getAll("productImages") as File[];

    // Check if there are files to upload
    if (!files || files.length === 0) {
      return new NextResponse("Product images are required", { status: 400 });
    }

    // Log for debugging
    console.log(`Processing ${files.length} files for upload`);

    // Filter out any non-File objects that might have been passed
    const validFiles = files.filter(file => file instanceof File && file.size > 0);

    if (validFiles.length === 0) {
      return new NextResponse("No valid files found to upload", { status: 400 });
    }

    // 1. Upload product images to R2
    const uploadedImageUrls = await Promise.all(
      validFiles.map(async (file) => {
        console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadProductImageToR2(name, buffer, file.type, file.name);
        console.log(`File uploaded successfully. URL: ${url}`);
        return url;
      })
    );

    console.log("All files uploaded successfully:", uploadedImageUrls);

    // 2. Insert product with image URLs
    const productData = {
      name,
      slug,
      description,
      category,
      mrp,
      ourPrice,
      deliveryMode,
      sku,
      status,
      subProductStatus,
      totalStocks,
      productImages: uploadedImageUrls,
    };

    // Type assertion to overcome the type checking issues
    const [insertedProduct] = await db
      .insert(products)
      .values(productData as any)
      .returning();

    const productId = insertedProduct.id;
    console.log("Product inserted with ID:", productId);

    // 3. Insert specs
    for (const specGroup of specifications) {
      const { groupName, fields } = specGroup;

      if (fields.length === 0) continue;

      const [group] = await db
        .insert(productSpecGroups)
        .values({
          productId,
          groupName,
        })
        .returning();

      const groupId = group.id;

      const fieldValues = fields.map((field: { fieldName: string; fieldValue: string }) => ({
        groupId,
        fieldName: field.fieldName,
        fieldValue: field.fieldValue,
      }));

      if (fieldValues.length > 0) {
        await db.insert(productSpecFields).values(fieldValues);
      }
    }

    return NextResponse.json({
      success: true,
      productId,
      message: "Product created successfully",
      imageUrls: uploadedImageUrls
    });
  } catch (error) {
    console.error("[PRODUCT_POST_ERROR]", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET route to fetch all products
export async function GET() {
  try {
    // Fetch all products from the database
    const allProducts = await db.select().from(products)

    return NextResponse.json(allProducts, { status: 200 })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: 'Product IDs are required' },
        { status: 400 }
      );
    }

    // 1. Fetch products to get their image URLs
    const productList = await db.query.products.findMany({
      where: inArray(products.id, ids.map(Number)),
      columns: { productImages: true },
    });

    // 2. Delete each product's images from R2
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

    // 3. Delete products from the database
    const result = await db
      .delete(products)
      .where(inArray(products.id, ids.map(Number)));

    return NextResponse.json({
      message: 'Products and associated images removed successfully',
      result,
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json(
      { message: 'Failed to delete products' },
      { status: 500 }
    );
  }
} 