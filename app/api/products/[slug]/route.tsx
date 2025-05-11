// /api/products/[slug]/route.ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { products } from "@/db/schema/products/products.schema";
import { productGroupMappings, productSpecFields, productSpecGroups } from "@/migrations/schema";
import { uploadProductImageToR2 } from "@/lib/r2";

type Params = Promise<{slug: string}>;


export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { slug } = await params;

    // Fetch the product
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    console.log(`Product query result:`, productResult.length ? `Found product with ID: ${productResult[0].id}` : "No product found");

    if (!productResult || productResult.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const product = productResult[0];
    console.log(`Product ID: ${product.id}, Name: ${product.name}`);

    // Get the specifications for this product only
    const specData = await db
      .select({
        groupName: productSpecGroups.groupName,
        fieldName: productSpecFields.fieldName,
        fieldValue: productSpecFields.fieldValue,
      })
      .from(productSpecFields)
      .innerJoin(
        productSpecGroups,
        eq(productSpecFields.groupId, productSpecGroups.id)
      )
      .where(eq(productSpecFields.productId, product.id));

    console.log(`Found ${specData.length} specification fields for product ID: ${product.id}`);
        
    // Group the specification data by groupName
    const specifications = specData.reduce((acc, row) => {
      const existingGroup = acc.find((g) => g.groupName === row.groupName);
      const field = { fieldName: row.fieldName, fieldValue: row.fieldValue };

      if (existingGroup) {
        existingGroup.fields.push(field);
      } else {
        acc.push({
          groupName: row.groupName,
          fields: [field],
        });
      }

      return acc;
    }, [] as { groupName: string; fields: { fieldName: string; fieldValue: string }[] }[]);

    console.log(`Grouped into ${specifications.length} specification groups`);
    
    // Combine product data with specifications
    const productWithSpecs = {
      ...product,
      status: product.status as "active" | "inactive",
      subProductStatus: product.subProductStatus as "active" | "inactive",
      deliveryMode: product.deliveryMode as "standard" | "express",
      specifications,
    };

    console.log(`Returning complete product data with specifications`);
    return NextResponse.json(productWithSpecs, { status: 200 });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return NextResponse.json({ message: "Failed to fetch product" }, { status: 500 });
  }
}
// Assuming these types are defined elsewhere
interface ProductResponse {
  success: boolean;
  productId: string;
  message: string;
  imageUrls?: string[];
}

interface ErrorResponse {
  message: string;
  error: string;
}

// PUT method to update a product
export async function PUT(req: Request, { params }: { params: Params } ) {
  try {
    const { slug } = await params;
    const formData = await req.formData();

    // Extract and validate form data
    const name = formData.get("name")?.toString() || "";
    const newSlug = formData.get("slug")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const category = formData.get("category")?.toString() || "";
    const brand = formData.get("brand")?.toString() || "";
    const color = formData.get("color")?.toString() || "";
    const material = formData.get("material")?.toString() || "";
    const dimensions = formData.get("dimensions")?.toString() || "";
    const weight = formData.get("weight")?.toString() || "";
    const tagsRaw = formData.get("tags")?.toString() || "";
    const mrp = formData.get("mrp")?.toString() || "";
    const ourPrice = formData.get("ourPrice")?.toString() || "";
    const totalStocks = formData.get("totalStocks")?.toString() || "";
    const deliveryMode = (formData.get("deliveryMode")?.toString() || "standard") as "standard" | "express";
    const sku = formData.get("sku")?.toString() || "";
    const status = (formData.get("status")?.toString() || "active") as "active" | "inactive";
    const subProductStatus = (formData.get("subProductStatus")?.toString() || "active") as "active" | "inactive";

    // Keep tags as a comma-separated string to match the schema
    const tags = tagsRaw;

    // Validate required fields
    if (!name) {
      return NextResponse.json<ErrorResponse>(
        { message: "Product name is required", error: "Missing name" },
        { status: 400 }
      );
    }

    if (!brand) {
      return NextResponse.json<ErrorResponse>(
        { message: "Brand is required", error: "Missing brand" },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json<ErrorResponse>(
        { message: "Color is required", error: "Missing color" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json<ErrorResponse>(
        { message: "Category is required", error: "Missing category" },
        { status: 400 }
      );
    }

    if (!sku) {
      return NextResponse.json<ErrorResponse>(
        { message: "SKU is required", error: "Missing SKU" },
        { status: 400 }
      );
    }

    // Validate number fields
    if (!mrp) {
      return NextResponse.json<ErrorResponse>(
        { message: "MRP is required", error: "Missing MRP" },
        { status: 400 }
      );
    }
    if (!/^\d+\.\d{2}$/.test(mrp)) {
      return NextResponse.json<ErrorResponse>(
        { message: "MRP must be a valid number with two decimal places (e.g., 99.99)", error: "Invalid MRP" },
        { status: 400 }
      );
    }

    if (!ourPrice) {
      return NextResponse.json<ErrorResponse>(
        { message: "Our Price is required", error: "Missing Our Price" },
        { status: 400 }
      );
    }
    if (!/^\d+\.\d{2}$/.test(ourPrice)) {
      return NextResponse.json<ErrorResponse>(
        { message: "Our Price must be a valid number with two decimal places (e.g., 49.99)", error: "Invalid Our Price" },
        { status: 400 }
      );
    }

    if (!totalStocks) {
      return NextResponse.json<ErrorResponse>(
        { message: "Total Stocks is required", error: "Missing Total Stocks" },
        { status: 400 }
      );
    }
    if (!/^\d+$/.test(totalStocks)) {
      return NextResponse.json<ErrorResponse>(
        { message: "Total Stocks must be a valid integer", error: "Invalid Total Stocks" },
        { status: 400 }
      );
    }

    const specifications = JSON.parse(formData.get("specifications")?.toString() || "[]") as {
      groupName: string;
      fields: { fieldName: string; fieldValue: string }[];
    }[];

    // Fetch existing product
    const [existingProduct] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);

    if (!existingProduct) {
      return NextResponse.json<ErrorResponse>(
        { message: "Product not found", error: "Invalid slug" },
        { status: 404 }
      );
    }

    const productId = existingProduct.id;

    // Handle images
    let uploadedImageUrls: string[] = [];
    const existingImages = existingProduct.productImages || [];
    const imageInputs = formData.getAll("productImages");

    if (imageInputs.length > 0) {
      // Process new images
      const validImages = imageInputs.filter((item): item is File | string => {
        if (item instanceof File) {
          return item.size > 0;
        }
        return typeof item === "string" && item.trim() !== "";
      });

      if (validImages.length === 0) {
        return NextResponse.json<ErrorResponse>(
          { message: "No valid images provided", error: "Invalid images" },
          { status: 400 }
        );
      }

      uploadedImageUrls = await Promise.all(
        validImages.map(async (item) => {
          if (item instanceof File) {
            const buffer = Buffer.from(await item.arrayBuffer());
            return await uploadProductImageToR2(name, buffer, item.type, item.name);
          }
          return item; // Keep existing image URL
        })
      );
    } else {
      // Keep existing images if no new images are provided
      uploadedImageUrls = existingImages;
    }

    if (uploadedImageUrls.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: "At least one product image is required", error: "Missing images" },
        { status: 400 }
      );
    }

    // Prepare product update data
    const productData = {
      name,
      slug: newSlug,
      description,
      category,
      brand,
      color,
      material: material || null,
      dimensions: dimensions || null,
      weight: weight || null,
      tags,
      mrp,
      ourPrice,
      deliveryMode,
      sku,
      status,
      subProductStatus,
      totalStocks,
      productImages: uploadedImageUrls,
      updatedAt: new Date(),
    };

    // Update product
    await db
      .update(products)
      .set(productData)
      .where(eq(products.id, productId))
      .returning();

    // Handle specifications
    // Step 1: Delete existing specification fields and group mappings
    await db.delete(productSpecFields).where(eq(productSpecFields.productId, productId));
    await db.delete(productGroupMappings).where(eq(productGroupMappings.productId, productId));

    // Step 2: Insert new specifications
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
      const fieldValues = fields
        .filter((field) => field.fieldName.trim() && field.fieldValue.trim())
        .map((field) => ({
          groupId,
          productId,
          fieldName: field.fieldName,
          fieldValue: field.fieldValue,
        }));

      if (fieldValues.length > 0) {
        await db.insert(productSpecFields).values(fieldValues);
      }
    }

    return NextResponse.json<ProductResponse>({
      success: true,
      productId,
      message: "Product updated successfully",
      imageUrls: uploadedImageUrls,
    });
  } catch (error) {
    console.error("[PRODUCT_PUT_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}