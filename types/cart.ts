export type ProductImage = { url: string }

export type CartOfferProduct = {
  id: string
  productName: string
  productImage: string
  range: string
  ourPrice: string
  quantity: number
}

export type ProductVariant = {
  id: string
  productId: string
  name: string
  sku: string
  slug: string
  color: string | null
  material: string | null
  dimensions: string | null
  weight: string | null
  storage: string | null
  stock: string
  mrp: string
  ourPrice: string
  productImages: ProductImage[]
  createdAt: string
  updatedAt: string
}

export type Product = {
  id: string
  shortName: string
  description: string | null
  category: string
  brand: string
  status: "active" | "inactive"
  subProductStatus: "active" | "inactive"
  totalStocks: string
  averageRating: string
  ratingCount: string
  createdAt: string
  updatedAt: string
}

export type Coupon = {
  code: string
  type: "amount" | "percentage"
  value: number
  couponId: string
  couponType: "individual" | "special"
}

export type CartItem = {
  id: string
  userId: string
  productId: string
  variantId: string
  cartOfferProductId?: string
  quantity: number
  createdAt: string
  updatedAt: string
  isOfferProduct?: boolean
  product: Product
  variant: ProductVariant
  offerProductPrice?: string
  offerProduct?: {
    id: string
    productName: string
    productImage: string
    ourPrice: string
  }
}

export type CartData = {
  items: CartItem[]
  coupon: Coupon | null
}
