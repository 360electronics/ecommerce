'use client';

import React, { useEffect, useState } from 'react';
import ProductCardwithCart from '../ProductCards/ProductCardwithCart';
import { FlattenedProduct } from '@/types/product';

interface SimilarProductsProps {
  product: FlattenedProduct | null;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({ product }) => {
  const [similarProducts, setSimilarProducts] = useState<FlattenedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSimilarProducts = async () => {
      if (!product?.id) {
        setSimilarProducts([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/products/similar?variantId=${product.id}`, {
          headers: {
            'x-super-secure-key': process.env.NEXT_PUBLIC_API_SECRET_KEY ?? '',
          },
          cache: 'no-store', // always fresh, no accidental stale cache
        });

        if (!res.ok) {
          console.error('Failed to fetch similar products:', res.statusText);
          setSimilarProducts([]);
        } else {
          const data = await res.json();
          setSimilarProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error loading similar products:', err);
        setSimilarProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadSimilarProducts();
  }, [product?.id]);

  if (loading) {
    return (
      <div className="mx-auto px-4 max-w-7xl">
        <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-48 w-full rounded-lg mb-4" />
              <div className="bg-gray-200 h-6 w-3/4 rounded mb-2" />
              <div className="bg-gray-200 h-4 w-1/2 rounded mb-2" />
              <div className="bg-gray-200 h-4 w-1/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!similarProducts.length) {
    return (
      <div className="mx-auto py-10">
        <h2 className="text-2xl font-medium mb-6">Similar Products</h2>
        <p className="text-gray-600">No similar products found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto py-10">
      <h2 className="text-2xl font-medium mb-6">Similar Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {similarProducts.map((variant) => (
          <ProductCardwithCart
            key={variant.id}
            image={
              Array.isArray(variant.productImages)
                ? (
                    variant.productImages.find((img: { isFeatured?: boolean }) => img.isFeatured)?.url ||
                    variant.productImages[0]?.url ||
                    ''
                  )
                : ''
            }
            name={variant.name}
            rating={
              typeof variant.averageRating === 'number'
                ? variant.averageRating
                : Number(variant.averageRating) || 0
            }
            ourPrice={
              typeof variant.ourPrice === 'number'
                ? variant.ourPrice
                : Number(variant.ourPrice) || 0
            }
            mrp={
              typeof variant.mrp === 'number'
                ? variant.mrp
                : Number(variant.mrp) || 0
            }
            slug={variant.slug}
            productId={variant.productId}
            variantId={variant.id}
            showViewDetails={true}
            className="w-full"
          />
        ))}
      </div>
    </div>
  );
};

export default SimilarProducts;
