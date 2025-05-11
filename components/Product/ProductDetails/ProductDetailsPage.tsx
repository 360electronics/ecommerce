import ProductImageGallery from "./ProductImageGallery"
import ProductDetailsContent from "./ProductDetailsContent"
import ProductSpecifications from "./ProductSpecifications"
// import ProductRatingsReviews from "./ProductRatingsReviews"
import ProductZoomOverlay from "./ProductZoomOverlay"
import Breadcrumbs from "@/components/Reusable/BreadScrumb"
import { ProductProvider } from "@/context/product-context"
import type { Product } from "@/types/product"

interface ProductDetailPageProps {
  product: Product
}

export default function ProductDetailPage({ product }: ProductDetailPageProps) {
  // Prepare breadcrumb items
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: product.category, path: `/category/${product.category.toLowerCase().replace(/\s+/g, "-")}` },
    { name: product.name, path: `` },
  ]

  return (
    <ProductProvider product={product}>
      <div className="container mx-auto px-4 pb-8 ">
        <Breadcrumbs breadcrumbs={breadcrumbItems} className="my-6 hidden"/>

        <div className="flex flex-col md:flex-row md:mb-12 mb-1">
          <div className="w-full md:w-[40%]">
            <ProductImageGallery />
          </div>

          <div className="w-full md:w-[60%] product-details relative">
            <ProductZoomOverlay />
            <ProductDetailsContent />
          </div>
        </div>

        <ProductSpecifications className="mb-12" />

        {/* <ProductRatingsReviews /> */}
      </div>
    </ProductProvider>
  )
}