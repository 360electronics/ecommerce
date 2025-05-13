// app/product/[productId]/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import UserLayout from '@/components/Layouts/UserLayout';
import ProductDetailPage from '@/components/Product/ProductDetails/ProductDetailsPage';
import { decodeUUID } from '@/utils/Encryption';

export interface FlattenedProduct {
  id: string;
  productId: string;
  name: string;
  mrp: number;
  ourPrice: number;
  averageRating: string;
  brand: string;
  category: string;
  color: string;
  createdAt: string;
  description: string | null;
  dimensions: string;
  material: string;
  productImages: string[];
  productParent: {
    averageRating: string;
    brand: string;
    category: string;
    createdAt: string;
    description: string | null;
    id: string;
    ratingCount: string;
    shortName: string;
    specifications: Array<{
      groupName: string;
      fields: Array<{ fieldName: string; fieldValue: string }>;
    }>;
    status: string;
    subProductStatus: string;
    tags: string[];
    totalStocks: string;
    updatedAt: string;
    variants: Array<{
      id: string;
      color: string;
      storage: string;
      slug: string;
      mrp: number;
      ourPrice: number;
      stock: string;
    }>;
  };
  sku: string;
  slug: string;
  stock: string;
  storage: string;
  tags: string[];
  totalStocks: string;
  updatedAt: string;
  weight: string;
  deliveryDate?: string;
  discount?: number;
}


type Params = Promise<{ productId: string; slug: string }>;

export default function Page({ params }: { params: Params }) {
  const resolvedParams = 'then' in params ? use(params) : params;
  const { productId: encodedProductId, slug } = resolvedParams;
  const productId = decodeUUID(encodedProductId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<FlattenedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);


  const getProductData = async (productId: string, slug: string): Promise<FlattenedProduct | null> => {
    try {
      const res = await fetch(`/api/products/${productId}/${slug}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch- fetch product data: ${res.status}`);
      }
      const data: FlattenedProduct = await res.json();
      console.log('Fetched product data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching product data:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError('Invalid product ID.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const data = await getProductData(productId, slug);

      if (data) {
        setProduct(data);
      } else {
        setError('Failed to load product. Retrying...');
        if (retryCount < 3) {
          setTimeout(() => setRetryCount((prev) => prev + 1), 2000);
        } else {
          setError('Product not found or server error.');
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [productId, slug, retryCount]);

  return (
    <UserLayout isCategory={false}>
      {isLoading ? (
        <div className="container mx-auto p-4 text-center">Loading product details...</div>
      ) : error ? (
        <div className="container mx-auto p-4 text-center text-red-600">
          {error}
          {retryCount < 3 && (
            <button
              onClick={() => setRetryCount((prev) => prev + 1)}
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          )}
        </div>
      ) : product ? (
        <ProductDetailPage product={product} />
      ) : (
        <div className="container mx-auto p-4 text-center">Product not found</div>
      )}
    </UserLayout>
  );
}