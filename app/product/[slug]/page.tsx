'use client';
import { useEffect, useState } from 'react';
import UserLayout from '@/components/Layouts/UserLayout';
import { useProductStore } from '@/store/product-store';
import toast from 'react-hot-toast';
import { FlattenedProduct } from '@/types/product';
import ProductDetailPage from '@/components/Product/ProductDetails/ProductDetailsPage';

type Params = { slug: string };

export default function Page({ params }: { params: Params }) {
  const { slug } = params;
  const { product, setProduct, isLoading, setIsLoading, error, setError } = useProductStore();
  const [initialLoad, setInitialLoad] = useState(true);

  const getProductData = async (slug: string): Promise<FlattenedProduct | null> => {
    try {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Product not found');
        }
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
      setIsLoading(true);
      setError(null);

      const data = await getProductData(slug);

      if (data) {
        setProduct(data);
        setInitialLoad(false);
      } else {
        setError({
          message: 'Failed to load product. Retrying...',
          name: ''
        });
        if (retryCount < maxRetries) {
          retryCount += 1;
          setTimeout(() => fetchData(), 2000);
        } else {
          setError({
            message: 'Product not found or server error.',
            name: 'ProductError'
          });
          toast.error('Failed to load product after multiple attempts.');
        }
      }

      setIsLoading(false);
    };

    if (initialLoad || !product || product.slug !== slug) {
      fetchData();
    }
  }, [slug, setProduct, setIsLoading, setError, product, initialLoad]);

  return (
    <UserLayout isCategory={false}>
      {isLoading ? (
        <div className="container mx-auto p-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 w-1/2 bg-gray-200 rounded mx-auto mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-[500px] w-full rounded-lg" />
              <div>
                <div className="bg-gray-200 h-10 w-3/4 rounded mb-4" />
                <div className="bg-gray-200 h-6 w-1/2 rounded mb-4" />
                <div className="bg-gray-200 h-24 w-full rounded mb-4" />
                <div className="bg-gray-200 h-12 w-1/3 rounded" />
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="container mx-auto p-4 text-center text-red-600">
          {error.message}
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              getProductData(slug).then((data) => {
                if (data) setProduct(data);
                else setError({
                  message: 'Failed to load product.',
                  name: 'ProductError'
                });
                setIsLoading(false);
              });
            }}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : product ? (
        <ProductDetailPage product={product} />
      ) : (
        <div className="container mx-auto p-4 text-center text-gray-600">Product not found</div>
      )}
    </UserLayout>
  );
}