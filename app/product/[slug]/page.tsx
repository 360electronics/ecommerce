"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import ProductDetailPage from "@/components/Product/ProductDetails/ProductDetailsPage"
import UserLayout from "@/components/Layouts/UserLayout"
import { Product } from "@/types/product"

type Params = Promise<{slug: string}>;

export default function Page( { params }: { params: Params }) {
  // Unwrap params with React.use() to handle both Promise and direct object
  const resolvedParams = 'then' in params ? use(params) : params;
  const { slug } = resolvedParams;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<Product | null>(null); 

  const getProductData = async (slug: string): Promise<Product | null> => {
    try {
      const res = await fetch(`/api/products/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to fetch product data:", res.status);
        return null;
      }
      const data: Product = await res.json();
      console.log("Fetched product data:", data); // Debugging
      return data;
    } catch (error) {
      console.error("Error fetching product data:", error);
      return null;
    }
  };

  // Fetch product data on component load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getProductData(slug);

      if (data) {
        // Directly set the fetched data as the product state
        setProduct(data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [slug]);

  return (
    <UserLayout isCategory={false}>
      {isLoading ? (
        <div className="container mx-auto p-4 text-center">Loading product details...</div>
      ) : product ? (
        <ProductDetailPage product={product}  />
      ) : (
        <div className="container mx-auto p-4 text-center">Product not found</div>
      )}
    </UserLayout>
  )
}