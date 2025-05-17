'use client';

import { useEffect } from 'react';
import { use } from 'react';
import UserLayout from '@/components/Layouts/UserLayout';
import ProductDetailPage from '@/components/Product/ProductDetails/ProductDetailsPage';
import { decodeUUID } from '@/utils/Encryption';
import { useProductStore } from '@/store/product-store';
import toast from 'react-hot-toast';
import { FlattenedProduct } from '@/store/types';

type Params = Promise<{ productId: string; slug: string }>;

export default function Page({ params }: { params: Params }) {
  const resolvedParams = 'then' in params ? use(params) : params;
  const { productId: encodedProductId, slug } = resolvedParams;
  const productId = decodeUUID(encodedProductId);
  const { product, setProduct, reset, isLoading, setIsLoading, error, setError } = useProductStore();

  const getProductData = async (productId: string, slug: string): Promise<FlattenedProduct | null> => {
    try {
      const res = await fetch(`/api/products/${productId}/${slug}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch product data: ${res.status}`);
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
    let retryCount = 0;
    const maxRetries = 3;

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
        if (retryCount < maxRetries) {
          retryCount += 1;
          setTimeout(() => fetchData(), 2000);
        } else {
          setError('Product not found or server error.');
          toast.error('Failed to load product after multiple attempts.');
        }
      }

      setIsLoading(false);
    };

    fetchData();

    // Reset store on unmount
    return () => reset();
  }, [productId, slug, setProduct, setIsLoading, setError, reset]);

  return (
    <UserLayout isCategory={false}>
      {isLoading ? (
        <div className="container mx-auto p-4 text-center">Loading product details...</div>
      ) : error ? (
        <div className="container mx-auto p-4 text-center text-red-600">
          {error}
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              getProductData(productId, slug).then((data) => {
                if (data) setProduct(data);
                else setError('Failed to load product.');
                setIsLoading(false);
              });
            }}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      ) : product ? (
        <ProductDetailPage product={product} />
      ) : (
        <div className="container mx-auto p-4 text-center">Product not found</div>
      )}
    </UserLayout>
  );
}