// components/Home/HomeDataInitializer.tsx
'use client';
import { useHomeStore } from '@/store/home-store';
import { Banner } from '@/types/banner';
import { Product } from '@/types/product';
import { useEffect } from 'react';

interface HomeDataInitializerProps {
  initialBanners: Banner[];
  initialFeaturedProducts: Product[];
  initialNewArrivals: Product[];
  initialGamersZoneProducts: {
    consoles: Product[];
    accessories: Product[];
    laptops: Product[];
    'steering-chairs': Product[];
  };
  initialBrandProducts: Product[];
}

export default function HomeDataInitializer({
  initialBanners,
  initialFeaturedProducts,
  initialNewArrivals,
  initialGamersZoneProducts,
  initialBrandProducts,
}: HomeDataInitializerProps) {
  const {
    banners,
    setBanners,
    setFeaturedProducts,
    setNewArrivals,
    setGamersZoneProducts,
    setBrandProducts,
  } = useHomeStore();

  useEffect(() => {
    if (banners.length === 0 && initialBanners.length > 0) {
      setBanners(initialBanners);
    }
    setFeaturedProducts(initialFeaturedProducts);
    setNewArrivals(initialNewArrivals);
    setGamersZoneProducts(initialGamersZoneProducts);
    setBrandProducts(initialBrandProducts);
  }, [
    initialBanners,
    initialFeaturedProducts,
    initialNewArrivals,
    initialGamersZoneProducts,
    initialBrandProducts,
    setBanners,
    setFeaturedProducts,
    setNewArrivals,
    setGamersZoneProducts,
    setBrandProducts,
  ]);

  return null;
}