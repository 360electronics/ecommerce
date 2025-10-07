'use client'
import React, { Suspense } from 'react';
import UserLayout from '@/components/Layouts/UserLayout';
import ProductListing from '@/components/Listing/ProductListing';
import { CompleteProduct, FlattenedProduct } from '@/types/product';
import { fetchProducts } from '@/utils/products.util';

// Helper function to safely convert to ISO string
const safeToISOString = (dateValue: Date | string | undefined | null): string => {
    if (!dateValue) return new Date().toISOString();
    if (dateValue instanceof Date) return dateValue.toISOString();
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
};

const flattenProductVariants = (products: CompleteProduct[]): FlattenedProduct[] => {
    const flattened: FlattenedProduct[] = [];

    products.forEach(product => {
      // console.log(product.subcategory?.slug === 'ASUS MOTHERBOARD')
        if (Array.isArray(product.variants) && product.variants.length > 0) {
            product.variants.forEach(variant => {
                flattened.push({
                    ...variant,
                    id: variant.id,
                    productId: product.id,
                    category: product.category?.slug || '',
                    subcategory: product.subcategory?.slug || '',
                    brand: product.brand,
                    status: product.status,
                    averageRating: product.averageRating?.toString() || '0',
                    tags: Array.isArray(product.tags)
                        ? product.tags
                        : typeof product.tags === 'string'
                            ? (product.tags as string).split(',').map((tag: string) => tag.trim())
                            : [],
                    totalStocks: variant.stock?.toString() || '0',
                    createdAt: safeToISOString(variant.createdAt),
                    updatedAt: safeToISOString(variant.updatedAt),
                    color: variant.attributes?.color as string | undefined,
                    storage: variant.attributes?.storage as string | undefined,
                    description: product.description || '',
                    productParent: product,
                    material: variant.attributes?.material as string | undefined,
                    mrp: variant.mrp?.toString() || '0',
                    ourPrice: variant.ourPrice?.toString() || '0'
                } as unknown as FlattenedProduct);
            });
        } else {
            flattened.push({
                ...product,
                id: product.id,
                productId: product.id,
                name: product.shortName || 'Unnamed Product',
                mrp: product.defaultVariant?.mrp?.toString() || '0',
                ourPrice: product.defaultVariant?.ourPrice?.toString() || '0',
                stock: product.totalStocks?.toString() || '0',
                slug: product.slug || '',
                sku: product.defaultVariant?.sku || '',
                tags: Array.isArray(product.tags)
                    ? product.tags
                    : typeof product.tags === 'string'
                        ? (product.tags as string).split(',').map((tag: string) => tag.trim())
                        : [],
                createdAt: safeToISOString(product.createdAt),
                updatedAt: safeToISOString(product.updatedAt),
                category: product.category?.slug || '',
                subcategory: product.subcategory?.slug || '',
                brand: product.brand,
                status: product.status,
                averageRating: product.averageRating?.toString() || '0',
                totalStocks: product.totalStocks?.toString() || '0',
                description: product.description || '',
            } as unknown as FlattenedProduct);
        }
    });

    return flattened;
};

const CategoryPageLoading = () => (
  <UserLayout>
    <div className="mx-auto py-6">
      <div className="h-12 bg-gray-200 rounded mb-8 animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  </UserLayout>
);

type Params = Promise<{ category: string }>;

export default async function CategoryPage({ params }: { params: Params }) {
  const {category} = await params;

  // Fetch products on the server
  let initialProducts: FlattenedProduct[] = [];
  try {
    const productData: CompleteProduct[] = await fetchProducts();
    initialProducts = flattenProductVariants(productData);
  } catch (err) {
    console.error('Error fetching products:', err);
    // You can handle error by rendering an error component here if needed
  }

  // Capitalize the category for display (if needed, but passed as is)
  const categoryName = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : '';

  return (
    <Suspense fallback={<CategoryPageLoading />}>
      <UserLayout>
        <div className="mx-auto pt-4 pb-10">
          {/* Product Listing Component */}
          <ProductListing category={category} initialProducts={initialProducts} />
        </div>
      </UserLayout>
    </Suspense>
  );
};