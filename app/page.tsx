
import TopTierBrands from '@/components/Home/Brands/TopTierBrands';
import OfferZoneCTA from '@/components/Home/CTA/OfferZoneCTA';
import FeaturedProducts from '@/components/Home/FeatureProducts/FeaturedProducts';
import GamersZone from '@/components/Home/GamersZone/GamersZone';
import HeroBanner from '@/components/Home/Hero/HeroBanner';
import NewArrivals from '@/components/Home/NewArrivals/NewArrivals';
import UserLayout from '@/components/Layouts/UserLayout';


export default function Home() {
  return (
    <UserLayout>
      <HeroBanner />
      <FeaturedProducts />
      <OfferZoneCTA backgroundImage='/customise.png' />
      <NewArrivals />
      <GamersZone />
      <TopTierBrands />
    </UserLayout>
  );
}