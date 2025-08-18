// ProductImageGallery.tsx
'use client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useProductStore } from '@/store/product-store';
import { ProductImage } from '@/types/product';

interface ProductImageGalleryProps {
  activeVariant: any;
}

export default function ProductImageGallery({ activeVariant }: ProductImageGalleryProps) {
  const { selectedImageIndex, setSelectedImageIndex, setLensPosition } = useProductStore();
  const [isHovered, setIsHovered] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset selectedImageIndex when activeVariant changes
    setSelectedImageIndex(0);
  }, [activeVariant.id, setSelectedImageIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setLensPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setLensPosition({ x: 0, y: 0 });
  };

  // Render a placeholder if no images
  if (!activeVariant.productImages || activeVariant.productImages.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative w-full aspect-square border rounded-lg overflow-hidden bg-gray-100">
          <Image
            src="/placeholder.svg"
            alt="Product placeholder"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-contain"
            placeholder="blur"
            blurDataURL="/placeholder.svg"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="relative w-16 h-16 border rounded-md overflow-hidden flex-shrink-0 bg-gray-100"
              aria-label={`Placeholder thumbnail ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  const validIndex = Math.max(0, Math.min(selectedImageIndex, activeVariant.productImages.length - 1));
  const currentImage = activeVariant.productImages[validIndex];

  return (
    <div className="flex flex-col md:flex-row-reverse gap-4 sticky top-32">
      {/* Main Image */}
      <div
        ref={imageContainerRef}
        className="relative   md:h-[70dvh] aspect-square border rounded-lg overflow-hidden bg-gray-100 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={currentImage.url || '/placeholder.svg'}
          alt={currentImage.alt || activeVariant.name || 'Product image'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
          className="object-contain mix-blend-multiply p-10"
          priority={validIndex === 0}
          placeholder="blur"
          blurDataURL="/placeholder.svg"
          onError={(e) => {
            e.currentTarget.srcset = '';
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      </div>

      {/* Thumbnails */}
      <div className="flex flex-row md:flex-col gap-2 overflow-x-auto w-full md:w-auto">
        {activeVariant.productImages.map((image: ProductImage, index: number) => (
          <button
            key={image.url + index}
            className={cn(
              'relative w-16 h-16 border rounded-md overflow-hidden flex-shrink-0 transition-colors cursor-pointer',
              selectedImageIndex === index ? 'border-primary' : 'border-gray-200 hover:border-primary-hover'
            )}
            onClick={() => setSelectedImageIndex(index)}
            aria-label={`Select ${activeVariant.name} image ${image.alt || index + 1}`}
          >
            <Image
              src={image.url || '/placeholder.svg'}
              alt={`${activeVariant.name} thumbnail ${image.alt || index + 1}`}
              fill
              sizes="64px"
              className="object-cover p-2"
              placeholder="blur"
              blurDataURL="/placeholder.svg"
              onError={(e) => {
                e.currentTarget.srcset = '';
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}