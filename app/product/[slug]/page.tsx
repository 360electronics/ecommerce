"use client"

import { useState } from "react"
import { products } from "@/components/Product/ProductDetails/Data"
import ProductDetailPage from "@/components/Product/ProductDetails/ProductDetailsPage"
import UserLayout from "@/components/Layouts/UserLayout"

export default function Page() {
  const [selectedProductId, setSelectedProductId] = useState(1)

  // Get the selected product
  const selectedProduct = products.find((product) => product.id === selectedProductId) || products[0]

  return (
    <UserLayout isCategory={false}>
      {/* Product detail page */}
      <ProductDetailPage product={selectedProduct} />
    </UserLayout>
  )
}