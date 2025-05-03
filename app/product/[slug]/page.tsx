"use client"

import { useState } from "react"
import { products } from "@/components/Product/ProductDetails/Data"
import ProductDetailPage from "@/components/Product/ProductDetails/ProductDetailsPage"

export default function DemoPage() {
  const [selectedProductId, setSelectedProductId] = useState(1)

  // Get the selected product
  const selectedProduct = products.find((product) => product.id === selectedProductId) || products[0]

  return (
    <div>
     

      {/* Product detail page */}
      <ProductDetailPage product={selectedProduct} />
    </div>
  )
}
