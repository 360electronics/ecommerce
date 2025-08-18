'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import ProductImageGallery from './ProductImageGallery';
import ProductDetailsContent from './ProductDetailsContent';
import ProductSpecifications from './ProductSpecifications';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import ProductZoomOverlay from './ProductZoomOverlay';
import { useProductStore } from '@/store/product-store';
import { FlattenedProduct, ProductVariant } from '@/types/product';
import ProductRatingsReviews from './ProductRatingsReviews';
import SimilarProducts from './SimilarProducts';
import ProductSpecsSideImages from './ProductSpecsSideImages';

interface ProductDetailPageProps {
  product: FlattenedProduct;
}

export default function ProductDetailPage({ product }: ProductDetailPageProps) {
  const { setProduct, selectedAttributes } = useProductStore();
  const [isClient, setIsClient] = useState(false);
  const specificationsRef = useRef<HTMLDivElement>(null); // Reference to ProductSpecifications
  const detailsContentRef = useRef<HTMLDivElement>(null); // Reference to ProductDetailsContent

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!product || !product.id || !product.productParent) {
      console.error('Invalid product data provided');
      return;
    }
    setProduct(product);
  }, [product, setProduct]);



  const activeVariant = useMemo((): ProductVariant => {
    if (!product?.productParent?.variants?.length) {
      console.warn('No variants available, returning fallback variant');
      return {
        id: product.id,
        productId: product.productId,
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        attributes: {},
        stock: Number(product.stock) || 0,
        lowStockThreshold: null,
        isBackorderable: false,
        mrp: Number(product.mrp) || 0,
        ourPrice: Number(product.ourPrice) || 0,
        salePrice: null,
        isOnSale: false,
        deliveryMode: product.productParent?.deliveryMode,
        productImages: Array.isArray(product.productImages) ? product.productImages : (product.productImages ? [product.productImages] : []),
        weight: Number(product.weight) || null,
        weightUnit: null,
        dimensions: null,
        isDefault: true,
        createdAt: typeof product.createdAt === 'string' ? new Date(product.createdAt) : product.createdAt,
        updatedAt: typeof product.updatedAt === 'string' ? new Date(product.updatedAt) : product.updatedAt,
        discountPercentage: (product as any).discount || null,
        isLowStock: false,
      };
    }
    const matchedVariant = product.productParent.variants.find((v) =>
      Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
    );
    return matchedVariant || product.productParent.variants.find((v) => v.id === product.id) || product.productParent.variants[0];
  }, [product, selectedAttributes]);

  const breadcrumbItems = useMemo(() => [
    { name: 'Home', path: '/' },
    {
      name: product.category || 'Category',
      path: `/category/${(product.category.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    },
    { name: product.name || 'Product', path: '' },
  ], [product.category, product.name]);

  if (!isClient || !product || !product.productParent) {
    return (
      <div className="mx-auto px-4 pb-16 max-w-7xl">
        <div className="animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded mb-6 hidden md:block" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="w-full">
              <div className="bg-gray-200 h-[500px] w-full rounded-lg mb-4" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 h-16 w-16 rounded-md" />
                ))}
              </div>
            </div>
            <div className="w-full">
              <div className="bg-gray-200 h-10 w-3/4 rounded mb-4" />
              <div className="bg-gray-200 h-6 w-1/2 rounded mb-4" />
              <div className="bg-gray-200 h-24 w-full rounded mb-4" />
              <div className="bg-gray-200 h-8 w-1/3 rounded mb-4" />
              <div className="bg-gray-200 h-12 w-1/2 rounded" />
            </div>
          </div>
          <div className="bg-gray-200 h-40 w-full rounded mb-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto pb-16 w-full">
      <Breadcrumbs breadcrumbs={breadcrumbItems as any} className="my-6 hidden md:block" />
      <div
        className="flex flex-col md:flex-row w-full relative space-x-10"
        role="region"
        aria-label="Product details"
      >
        <div className="  w-full md:w-auto sticky">
          <ProductImageGallery activeVariant={activeVariant} />
        </div>
        <div className="relative">
          <ProductZoomOverlay activeVariant={activeVariant} className="hidden lg:block" />
          <div ref={detailsContentRef} className="w-full ">
            <ProductDetailsContent activeVariant={activeVariant} />
          </div>
        </div>
      </div>
      <div ref={specificationsRef} className=' flex gap-10 relative'>
        <ProductSpecifications className="py-20 max-w-5xl w-full" />

        <ProductSpecsSideImages />
      </div>
      <ProductRatingsReviews />
      <SimilarProducts product={product as any} />
    </div>
  );
}