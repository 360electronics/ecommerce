"use client";

import { useEffect } from "react";
import TopTierBrands from "@/components/Home/Brands/TopTierBrands";
import OfferZoneCTA from "@/components/Home/CTA/OfferZoneCTA";
import FeaturedProducts from "@/components/Home/OfferZone/OfferZoneProducts";
import GamersZone from "@/components/Home/GamersZone/GamersZone";
import HeroBanner from "@/components/Home/Hero/HeroBanner";
import NewArrivals from "@/components/Home/NewArrivals/NewArrivals";
import { useHomeStore } from "@/store/home-store";

interface HomeState {
  banners: any[];
  featuredProducts: any[];
  newArrivals: any[];
  gamersZoneProducts: {
    consoles: any[];
    accessories: any[];
    laptops: any[];
    "steering-chairs": any[];
  };
  brandProducts: any[];
}

export default function HomeContent({
  initialData,
}: {
  initialData: HomeState;
}) {
  const {
    fetchHomeData,
    setInitialData,
    isLoading,
    error,
    banners,
    featuredProducts,
    newArrivals,
    gamersZoneProducts,
    brandProducts,
  } = useHomeStore();

  useEffect(() => {
    // Always set the initial data from server on mount
    setInitialData(initialData);

    // Check if the initial data is empty and refetch client-side if needed
    const noData =
      !initialData.banners.length &&
      !initialData.featuredProducts.length &&
      !initialData.newArrivals.length &&
      !Object.values(initialData.gamersZoneProducts).some(
        (arr) => arr.length
      ) &&
      !initialData.brandProducts.length;

    if (noData) {
      fetchHomeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  const hasData =
    banners.length > 0 ||
    featuredProducts.length > 0 ||
    newArrivals.length > 0 ||
    Object.values(gamersZoneProducts).some((arr) => arr.length > 0) ||
    brandProducts.length > 0;

  if (isLoading && !hasData) {
    return (
      <div className="w-full flex items-center justify-center h-[70dvh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600">Loading home page...</p>
        </div>
      </div>
    );
  }

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