import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { products, variants } from "@/db/schema/products/products.schema";
import { eq } from "drizzle-orm";

type Params = Promise<{ id: string }>;

interface SpecificationGroup {
  groupName: string;
  fields: { fieldName: string; fieldValue: string }[];
}

interface Variant {
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

interface Product {
  id: string;
  shortName: string;
  description: string | null;
  category: string;
  brand: string;
  status: "active" | "inactive";
  subProductStatus: "active" | "inactive";
  totalStocks: string;
  deliveryMode: "standard" | "express";
  tags: string | null;
  specifications: SpecificationGroup[];
  averageRating: string;
  ratingCount: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductResponse {
  product: Product;
  variants: Variant[];
}

interface ErrorResponse {
  message: string;
  error: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;

    // Validate product ID
    if (!id || typeof id !== "string" || id.trim() === "") {
      return NextResponse.json<ErrorResponse>(
        { message: "Invalid product ID", error: "Product ID is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Fetch the product
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!productResult || productResult.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: "Product not found", error: `No product found with ID: ${id}` },
        { status: 404 }
      );
    }

    const product = productResult[0];

    // Fetch associated variants
    const variantResult = await db
      .select()
      .from(variants)
      .where(eq(variants.productId, id));

    // Structure the response
    const responseData: ProductResponse = {
      product: {
        id: product.id,
        shortName: product.shortName,
        description: product.description || null,
        category: product.category,
        brand: product.brand,
        status: product.status as "active" | "inactive",
        subProductStatus: product.subProductStatus as "active" | "inactive",
        totalStocks: product.totalStocks,
        deliveryMode: product.deliveryMode as "standard" | "express",
        tags: product.tags || null,
        specifications: product.specifications || [],
        averageRating: product.averageRating,
        ratingCount: product.ratingCount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      variants: variantResult.map((variant) => ({
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        sku: variant.sku,
        slug: variant.slug,
        color: variant.color,
        material: variant.material || null,
        dimensions: variant.dimensions || null,
        weight: variant.weight || null,
        storage: variant.storage || null,
        stock: variant.stock,
        mrp: variant.mrp,
        ourPrice: variant.ourPrice,
        productImages: variant.productImages || [],
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      })),
    };

    console.log(`Fetched product ID: ${id} with ${variantResult.length} variants`);

    console.log(responseData)
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("[PRODUCT_GET_BY_ID_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      {
        message: "Failed to fetch product",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}