// app/page.tsx
import TopTierBrands from '@/components/Home/Brands/TopTierBrands';
import OfferZoneCTA from '@/components/Home/CTA/OfferZoneCTA';
import FeaturedProducts from '@/components/Home/FeatureProducts/FeaturedProducts';
import GamersZone from '@/components/Home/GamersZone/GamersZone';
import HeroBanner from '@/components/Home/Hero/HeroBanner';
import NewArrivals from '@/components/Home/NewArrivals/NewArrivals';
import UserLayout from '@/components/Layouts/UserLayout';
import HomeDataInitializer from '@/components/Home/HomeDataInitializer';
import { fetchFeaturedProducts, fetchNewArrivalsProducts, fetchGamersZoneProducts, fetchProducts } from '@/utils/products.util';
import { fetchBanners } from '@/utils/banners.utils';

export default async function Home() {
  const banners = await fetchBanners();
  const featuredProducts = await fetchFeaturedProducts();
  const newArrivals = await fetchNewArrivalsProducts();
  const gamersZoneProducts = await fetchGamersZoneProducts();
  const brandProducts = await fetchProducts();

  return (
    <UserLayout>
      <HomeDataInitializer
        initialBanners={banners.data || []}
        initialFeaturedProducts={featuredProducts || []}
        initialNewArrivals={newArrivals || []}
        initialGamersZoneProducts={gamersZoneProducts || {
          consoles: [],
          accessories: [],
          laptops: [],
          'steering-chairs': [],
        }}
        initialBrandProducts={brandProducts || []}
      />
      <HeroBanner />
      <FeaturedProducts />
      <OfferZoneCTA  />
      <NewArrivals />
      <GamersZone />
      <TopTierBrands />
    </UserLayout>
  );
}

export const dynamic = 'force-static';
export const revalidate = 3600;