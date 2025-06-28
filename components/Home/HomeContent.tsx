'use client';

import { useEffect } from 'react';
import TopTierBrands from '@/components/Home/Brands/TopTierBrands';
import OfferZoneCTA from '@/components/Home/CTA/OfferZoneCTA';
import FeaturedProducts from '@/components/Home/OfferZone/OfferZoneProducts';
import GamersZone from '@/components/Home/GamersZone/GamersZone';
import HeroBanner from '@/components/Home/Hero/HeroBanner';
import NewArrivals from '@/components/Home/NewArrivals/NewArrivals';
import { useHomeStore } from '@/store/home-store';

export default function HomeContent() {
  const { fetchHomeData, isLoading, error, banners, featuredProducts, newArrivals, gamersZoneProducts, brandProducts } = useHomeStore();

  useEffect(() => {
    // Fetch data on initial component mount only
    fetchHomeData();
  }, [fetchHomeData]);

  // Check if we have any data to display
  const hasData = banners.length > 0 ||
    featuredProducts.length > 0 ||
    newArrivals.length > 0 ||
    Object.values(gamersZoneProducts).some(arr => arr.length > 0) ||
    brandProducts.length > 0;

  return (
    <>

      <>
        <HeroBanner />
        <FeaturedProducts />
        <OfferZoneCTA />
        <NewArrivals />
        <GamersZone />
        <TopTierBrands />
      </>

    </>
  );
}