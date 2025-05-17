'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { useProductStore } from '@/store/product-store';

export default function ProductImageGallery() {
  const { product, selectedImageIndex, setSelectedImageIndex, setLensPosition } = useProductStore();
  const [isHovered, setIsHovered] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !product) return;

    const rect = imageContainerRef.current.getBoundingClientRect();

    // Calculate position as percentage of the container dimensions (0-100%)
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Set lens position as percentages for responsive behavior
    setLensPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    console.log(isHovered)
    setIsHovered(false);
    setLensPosition({ x: 0, y: 0 });
  };

  // Render a placeholder if product is null
  if (!product) {
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
          {/* Optional: Show placeholder thumbnails */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="relative w-16 h-16 border rounded-md overflow-hidden flex-shrink-0 bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div
        ref={imageContainerRef}
        className="relative w-full aspect-square border rounded-lg overflow-hidden bg-gray-100 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={product.productImages[selectedImageIndex] || '/placeholder.svg'}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-contain"
          priority={selectedImageIndex === 0}
          placeholder="blur"
          blurDataURL="/placeholder.svg"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      </div>

      {/* Toenails */}
      <div className="flex gap-2 overflow-x-auto">
        {product.productImages.map((image, index) => (
          <button
            key={index}
            className={cn(
              'relative w-16 h-16 border rounded-md overflow-hidden flex-shrink-0',
              selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
            )}
            onClick={() => setSelectedImageIndex(index)}
            aria-label={`Select image ${index + 1}`}
          >
            <Image
              src={image || '/placeholder.svg'}
              alt={`${product.name} thumbnail ${index + 1}`}
              fill
              sizes="64px"
              className="object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}