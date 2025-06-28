
import UserLayout from '@/components/Layouts/UserLayout';
import HomeContent from '@/components/Home/HomeContent';

// Metadata for SEO
export const metadata = {
  title: '360 Electronics - Shop the Latest Products',
  description: 'Discover featured products, new arrivals, and gamers zone items at the best prices.',
  openGraph: {
    title: '360 Electronics',
    description: 'Shop the latest products at unbeatable prices.',
    url: 'https://360electronics.in',
    type: 'website',
  },
};


export default function Home() {
  return (
    <UserLayout>
      <HomeContent />
    </UserLayout>
  );
}