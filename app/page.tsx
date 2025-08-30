// app/page.tsx
import UserLayout from '@/components/Layouts/UserLayout';
import HomeContent from '@/components/Home/HomeContent';
import { fetchWithRetry } from '@/store/store-utils';
import { Banner } from '@/types/banner';
import { Product } from '@/store/types';

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

async function fetchHomeData() {
  try {
    const [bannerResponse, featuredProducts, newArrivals, gamersZoneProducts, brandProducts] = await Promise.all([
      fetchWithRetry<{ data: Banner[] }>(() => fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/banner`, {
        headers: {
          'x-super-secure-key': process.env.API_SECRET_KEY!,
        }
      })).then((res) => res?.data || []),
      fetchWithRetry<Product[]>(() => fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/offer-zone`, {
        headers: {
          'x-super-secure-key': process.env.API_SECRET_KEY!,
        }
      })).then((res) => res || []),
      fetchWithRetry<Product[]>(() => fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/new-arrivals`, {
        headers: {
          'x-super-secure-key': process.env.API_SECRET_KEY!,
        }
      })).then((res) => res || []),
      fetchWithRetry<{
        consoles: Product[];
        accessories: Product[];
        laptops: Product[];
        'steering-chairs': Product[];
      }>(() => fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/gamers-zone`, {
        headers: {
          'x-super-secure-key': process.env.API_SECRET_KEY!,
        }
      })).then((res) => ({
        consoles: res?.consoles || [],
        accessories: res?.accessories || [],
        laptops: res?.laptops || [],
        'steering-chairs': res?.['steering-chairs'] || [],
      })),
      fetchWithRetry<Product[]>(() => fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`,{
        headers: {
          'x-super-secure-key': process.env.API_SECRET_KEY!,
        }
      })).then((res) => res || []),
    ]);

    return {
      banners: bannerResponse,
      featuredProducts,
      newArrivals,
      gamersZoneProducts,
      brandProducts,
    };
  } catch (error) {
    console.error('[fetchHomeData] Error fetching data:', error);
    return {
      banners: [],
      featuredProducts: [],
      newArrivals: [],
      gamersZoneProducts: { consoles: [], accessories: [], laptops: [], 'steering-chairs': [] },
      brandProducts: [],
    };
  }
}

export default async function Home() {
  const initialData = await fetchHomeData();

  return (
    <UserLayout>
      <HomeContent initialData={initialData} />
    </UserLayout>
  );
}