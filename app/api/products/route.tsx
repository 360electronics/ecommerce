import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle'; // Adjust to your db instance
import { products, productSpecGroups, productSpecFields } from '@/db/schema/products/products.schema'; 
import { deleteFromR2, extractKeyFromR2Url, uploadProductImageToR2 } from '@/lib/r2'; 
import { inArray } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const name = formData.get("name")?.toString() || "";
    const slug = formData.get("slug")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const category = formData.get("category")?.toString() || "";
    const mrp = parseFloat(formData.get("mrp")?.toString() || "0");
    const ourPrice = parseFloat(formData.get("ourPrice")?.toString() || "0");
    const deliveryMode = formData.get("deliveryMode")?.toString() || "standard";
    const sku = formData.get("sku")?.toString() || "";
    const status = formData.get("status")?.toString() as 'active' | 'inactive';
    const subProductStatus = formData.get("subProductStatus")?.toString() as 'active' | 'inactive';
    const totalStocks = parseInt(formData.get("totalStocks")?.toString() || "0", 10);

    const specifications = JSON.parse(formData.get("specifications")?.toString() || "[]");

    const files = formData.getAll("productImages") as File[];

    if (!files || files.length === 0) {
      return new NextResponse("Product images are required", { status: 400 });
    }

    const validFiles = files.filter(file => file instanceof File && file.size > 0);

    if (validFiles.length === 0) {
      return new NextResponse("No valid files found to upload", { status: 400 });
    }

    const uploadedImageUrls = await Promise.all(
      validFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return await uploadProductImageToR2(name, buffer, file.type, file.name);
      })
    );

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

    const [insertedProduct] = await db.insert(products).values(productData as any).returning();
    const productId = insertedProduct.id;

    for (const specGroup of specifications) {
      const { groupName, fields } = specGroup;

      if (!groupName || !fields?.length) continue;

      const [group] = await db.insert(productSpecGroups).values({
        productId,
        groupName,
      }).returning();

      const groupId = group.id;

      const fieldValues = fields.map((field: { fieldName: string; fieldValue: string }) => ({
        groupId,
        fieldName: field.fieldName,
        fieldValue: field.fieldValue,
      }));

      await db.insert(productSpecFields).values(fieldValues);
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
      where: inArray(products.id, ids.map(String)),
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
      .where(inArray(products.id, ids.map(String)));

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