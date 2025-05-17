'use client';

import { useEffect } from 'react';
import ProductImageGallery from './ProductImageGallery';
import ProductDetailsContent from './ProductDetailsContent';
import ProductSpecifications from './ProductSpecifications';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import ProductZoomOverlay from './ProductZoomOverlay';
import { useProductStore } from '@/store/product-store';
import { FlattenedProduct } from '@/store/types';

interface ProductDetailPageProps {
  product: FlattenedProduct;
}

export default function ProductDetailPage({ product }: ProductDetailPageProps) {
  const { setProduct } = useProductStore();

  // Initialize and reset product store
  useEffect(() => {
    setProduct(product);
    return () => useProductStore.getState().reset(); // Reset on unmount
  }, [product, setProduct]);

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    {
      name: product.category,
      path: `/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`,
    },
    { name: product.name, path: '' },
  ];

  return (
    <div className="mx-auto px-4 pb-8">
      <Breadcrumbs breadcrumbs={breadcrumbItems} className="my-6 hidden md:block" />

      <div className="flex flex-col md:flex-row md:mb-12 mb-1 relative">
        <div className="w-full md:w-[40%]">
          <ProductImageGallery />
        </div>

        <div className="w-full md:w-[60%] product-details">
          <ProductDetailsContent />
          <ProductZoomOverlay className="hidden md:block" />
        </div>
      </div>

      <ProductSpecifications className="mb-12" />

      {/* <ProductRatingsReviews /> */}
    </div>
  );
}