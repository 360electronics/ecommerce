
import UserLayout from '@/components/Layouts/UserLayout';
import HomeContent from '@/components/Home/HomeContent';

// Metadata for SEO
export const metadata = {
  title: '360 Electronics - Shop the Latest Products',
  description: 'Discover featured products, new arrivals, and gamers zone items at the best prices.',
  openGraph: {
    title: 'Your E-Commerce Store',
    description: 'Shop the latest products at unbeatable prices.',
    url: 'https://your-site.com',
    type: 'website',
  },
};

export const revalidate = 3600; // ISR: Revalidate every hour

export default function Home() {
  return (
    <UserLayout>
      <HomeContent />
    </UserLayout>
  );
}