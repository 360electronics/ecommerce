// components/Home/HomeContent.tsx
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
    const hasFetched = sessionStorage.getItem("home-data-fetched");
    if (!hasFetched) {
      setInitialData(initialData);

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

      sessionStorage.setItem("home-data-fetched", "true");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Only once

  const hasData =
    banners.length > 0 ||
    featuredProducts.length > 0 ||
    newArrivals.length > 0 ||
    Object.values(gamersZoneProducts).some((arr) => arr.length > 0) ||
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
