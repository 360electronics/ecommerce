import HomeContent from "@/components/Home/HomeContent";
import { fetchWithRetry } from "@/store/store-utils";
import { Banner } from "@/types/banner";
import { Product } from "@/store/types";

/* ---------------------------------------------
   ISR CONFIG (VERY IMPORTANT)
--------------------------------------------- */
export const revalidate = 300; // 5 minutes

// SEO
export const metadata = {
  title: "360 Electronics - Shop the Latest Products",
  description:
    "Discover featured products, new arrivals, and gamers zone items at the best prices.",
  openGraph: {
    title: "360 Electronics",
    description: "Shop the latest products at unbeatable prices.",
    url: "https://360electronics.in",
    type: "website",
  },
};

async function fetchHomeData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const headers = { "x-super-secure-key": process.env.API_SECRET_KEY! };

    /* ---------------------------------------------
       PARALLEL FETCH (CACHED)
    --------------------------------------------- */
    const [bannerResponse, featuredProducts, newArrivals, gamersZoneProducts] =
      await Promise.all([
        // 🧱 Banners
        fetchWithRetry<{ data: Banner[] }>(() =>
          fetch(`${baseUrl}/api/banner`, {
            headers,
            next: { revalidate: 300 },
          })
        ).then((res) => res?.data || []),

        // 💥 Offer Zone
        fetchWithRetry<Product[]>(() =>
          fetch(`${baseUrl}/api/products/offer-zone`, {
            headers,
            next: { revalidate: 300 },
          })
        ).then((res) => res || []),

        // 🆕 New Arrivals
        fetchWithRetry<Product[]>(() =>
          fetch(`${baseUrl}/api/products/new-arrivals`, {
            headers,
            next: { revalidate: 300 },
          })
        ).then((res) => res || []),

        // 🎮 Gamers Zone
        fetchWithRetry<{
          consoles: Product[];
          accessories: Product[];
          laptops: Product[];
          "steering-chairs": Product[];
        }>(() =>
          fetch(`${baseUrl}/api/products/gamers-zone`, {
            headers,
            next: { revalidate: 300 },
          })
        ).then((res) => ({
          consoles: res?.consoles || [],
          accessories: res?.accessories || [],
          laptops: res?.laptops || [],
          "steering-chairs": res?.["steering-chairs"] || [],
        })),
      ]);

    /* ---------------------------------------------
       BRAND PRODUCTS (SEQUENTIAL BUT CACHED)
    --------------------------------------------- */
    const brands = ["asus", "hp", "dell", "apple", "acer"];
    const brandProducts: { brand: string; products: Product[] }[] = [];

    for (const brand of brands) {
      try {
        const response = await fetch(
          `${baseUrl}/api/products/brands?brand=${brand}&category=laptops`,
          {
            headers,
            next: { revalidate: 300 }, // ✅ CACHED
          }
        );

        const json = await response.json();
        brandProducts.push({
          brand,
          products: json?.data || [],
        });
      } catch (err) {
        console.error(`⚠️ Brand fetch failed for ${brand}:`, err);
        brandProducts.push({ brand, products: [] });
      }
    }

    return {
      banners: bannerResponse,
      featuredProducts,
      newArrivals,
      gamersZoneProducts,
      brandProducts,
    };
  } catch (error) {
    console.error("[fetchHomeData] Error:", error);

    return {
      banners: [],
      featuredProducts: [],
      newArrivals: [],
      gamersZoneProducts: {
        consoles: [],
        accessories: [],
        laptops: [],
        "steering-chairs": [],
      },
      brandProducts: [],
    };
  }
}

/* ---------------------------------------------
   PAGE
--------------------------------------------- */
export default async function Home() {
  const initialData = await fetchHomeData();
  return <HomeContent initialData={initialData} />;
}
