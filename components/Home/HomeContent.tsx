// components/Home/HomeContent.tsx
'use client';

import { useEffect } from 'react';
import TopTierBrands from '@/components/Home/Brands/TopTierBrands';
import OfferZoneCTA from '@/components/Home/CTA/OfferZoneCTA';
import FeaturedProducts from '@/components/Home/OfferZone/OfferZoneProducts';
import GamersZone from '@/components/Home/GamersZone/GamersZone';
import HeroBanner from '@/components/Home/Hero/HeroBanner';
import NewArrivals from '@/components/Home/NewArrivals/NewArrivals';
import { useHomeStore } from '@/store/home-store';

interface HomeState {
  banners: any[];
  featuredProducts: any[];
  newArrivals: any[];
  gamersZoneProducts: {
    consoles: any[];
    accessories: any[];
    laptops: any[];
    'steering-chairs': any[];
  };
  brandProducts: any[];
}

export default function HomeContent({ initialData }: { initialData: HomeState }) {
  const { fetchHomeData, setInitialData, isLoading, error, banners, featuredProducts, newArrivals, gamersZoneProducts, brandProducts } = useHomeStore();

  useEffect(() => {
    // Initialize store with server-fetched data
    setInitialData(initialData);
    // Only fetch if no data is available or cache is stale
    if (
      !initialData.banners.length &&
      !initialData.featuredProducts.length &&
      !initialData.newArrivals.length &&
      !Object.values(initialData.gamersZoneProducts).some(arr => arr.length) &&
      !initialData.brandProducts.length
    ) {
      fetchHomeData();
    }
  }, [fetchHomeData, setInitialData, initialData]);

  const hasData = banners.length > 0 ||
    featuredProducts.length > 0 ||
    newArrivals.length > 0 ||
    Object.values(gamersZoneProducts).some(arr => arr.length > 0) ||
    brandProducts.length > 0;

  return (
    <>
      <HeroBanner />
      <FeaturedProducts />
      <OfferZoneCTA />
      <NewArrivals />
      <GamersZone />
      <TopTierBrands />
    </>
  );
}