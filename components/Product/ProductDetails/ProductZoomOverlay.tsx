'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProductContext } from '@/context/product-context';
import { cn } from '@/lib/utils';
import { useProductStore } from '@/store/product-store';

interface ProductZoomOverlayProps {
  zoomFactor?: number;
  className?: string;
}

export default function ProductZoomOverlay({
  zoomFactor = 2.5,
  className,
}: ProductZoomOverlayProps) {
  const { product, selectedImageIndex, lensPosition } = useProductStore();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentImageUrl = useMemo(() => {
    return product.productImages[selectedImageIndex] || '/placeholder.svg';
  }, [product.productImages, selectedImageIndex]);

  // Only show overlay when lens position is set (indicating mouse hover)
  const isActive = lensPosition.x > 0 && lensPosition.y > 0;

  if (!isMounted || !isActive) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute top-0 right-0 z-0 w-[60%] h-full border border-gray-200 bg-white',
        'overflow-hidden',
        className
      )}
      role="region"
      aria-label="Magnified product image view"
    >
      <div 
        className="relative w-full h-full"
        style={{
          backgroundImage: `url(${currentImageUrl})`,
          backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
          backgroundSize: `${zoomFactor * 100}%`,
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  );
}