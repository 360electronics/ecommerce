// ProductZoomOverlay.tsx
'use client';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useProductStore } from '@/store/product-store';

interface ProductZoomOverlayProps {
  activeVariant: any;
  zoomFactor?: number;
  className?: string;
}

export default function ProductZoomOverlay({
  activeVariant,
  zoomFactor = 2.5,
  className,
}: ProductZoomOverlayProps) {
  const { selectedImageIndex, lensPosition } = useProductStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentImageUrl = useMemo(() => {
    return activeVariant.productImages[selectedImageIndex]?.url || '/placeholder.svg';
  }, [activeVariant.productImages, selectedImageIndex]);

  const isActive = lensPosition.x > 0 && lensPosition.y > 0;

  if (!isMounted || !isActive) {
    return null;
  }

  return (
    <div
      className={cn(
        'sticky top-32 right-0 z-10 w-full h-[70dvh] border border-gray-200 bg-white rounded-lg shadow-lg overflow-hidden',
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
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  );
}