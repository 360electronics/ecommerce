// app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import ProductDetailPage from '@/components/Product/ProductDetails/ProductDetailsPage';
import { FlattenedProduct } from '@/types/product';

async function getProductData(slug: string): Promise<FlattenedProduct | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${slug}`, {
      // Cache for 60s: popular products render from Vercel's data cache instead
      // of a DB round trip per view. Checkout re-prices server-side, so a
      // briefly stale displayed price/stock can't affect what customers pay.
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch product: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching product:', err);
    return null;
  }
}

type Params = Promise<{ slug: string }>

export default async function Page({ params }: { params: Params }) {

  const { slug } = await params
  const product = await getProductData(slug);

  if (!product) {
    notFound();
  }

  return (
      <ProductDetailPage product={product} />
  );
}
