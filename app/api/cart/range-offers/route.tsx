import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/drizzle"
import { cart_offer_products } from "@/db/schema"
import { eq } from "drizzle-orm"
import { uploadCartOffProductImageToR2 } from "@/lib/r2"

// GET: Fetch cart offer products, optionally filtered by range
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range")

    const products = await db
      .select({
        id: cart_offer_products.id,
        productName: cart_offer_products.productName,
        range: cart_offer_products.range,
        ourPrice: cart_offer_products.ourPrice,
        quantity: cart_offer_products.quantity,
        productImage: cart_offer_products.productImage,
      })
      .from(cart_offer_products)
      .where(range ? eq(cart_offer_products.range, range) : undefined)

    return NextResponse.json(products, { status: 200 })
  } catch (error) {
    console.error("Error fetching cart offer products:", error)
    return NextResponse.json({ error: "Failed to fetch cart offer products" }, { status: 500 })
  }
}

// POST: Add a new cart offer product
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const productName = formData.get("productName") as string
    const range = formData.get("range") as string
    const ourPrice = formData.get("ourPrice") as string
    const quantity = formData.get("quantity") as string
    const productImage = formData.get("productImage") as File

    // Validate input
    if (!productName || !range || !ourPrice || !quantity || !productImage) {
      return NextResponse.json({ error: "All fields are required, including product image" }, { status: 400 })
    }

    if (!["1000", "5000", "10000", "25000"].includes(range)) {
      return NextResponse.json({ error: "Invalid range value" }, { status: 400 })
    }

    const parsedPrice = parseFloat(ourPrice)
    const parsedQuantity = parseInt(quantity, 10)
    if (isNaN(parsedPrice) || parsedPrice <= 0 || isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json({ error: "Invalid price or quantity" }, { status: 400 })
    }

    // Validate image type
    if (!productImage.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 })
    }

    // Upload image to R2
    const fileBuffer = Buffer.from(await productImage.arrayBuffer())
    const fileName = `${Date.now()}-${productImage.name}`
    const mimeType = productImage.type
    const imageUrl = await uploadCartOffProductImageToR2("cart-offer", fileBuffer, mimeType, fileName)

    // Save product to database
    const [newProduct] = await db
      .insert(cart_offer_products)
      .values({
        productName,
        range,
        ourPrice: parsedPrice.toFixed(2),
        quantity: parsedQuantity,
        productImage: imageUrl,
      })
      .returning()

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error("Error creating cart offer product:", error)
    return NextResponse.json({ error: "Failed to create cart offer product" }, { status: 500 })
  }
}