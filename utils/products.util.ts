'use server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`,  {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-super-secure-key': `${process.env.API_SECRET_KEY}`
      },
      cache: 'no-cache'
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // console.log("All Product Data:",data)
    return data; // Expected format: Product[]
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return []; // Fallback to empty array
  }
}

export async function fetchCategoryProducts({
  category,
  subcategory,
  brand,

}: {
  category?: string;
  subcategory?: string;
  brand?: string;
  page?: number;
  limit?: number;
} = {}) {
  try {
    const query = new URLSearchParams();
    if (category) query.append("category", category);
    if (subcategory) query.append("subcategory", subcategory);
    if (brand) query.append("brand", brand);
    

    const res = await fetch(`${API_BASE_URL}/api/products?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // ✅ Avoid Next.js data cache limit
      next: { revalidate: 60 }, // ✅ Optional ISR (1 min revalidation)
    });

    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    const { data } = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch category products:", err);
    return [];
  }
}

export async function fetchSearchProducts(query: string) {
  try {
    const params = new URLSearchParams();
    if (query) params.append("search", query);

    const res = await fetch(`${API_BASE_URL}/api/products?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store", // avoid Next.js cache overflow
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`Error: ${res.statusText}`);
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : data; // in case your API returns wrapped data
  } catch (err) {
    console.error("Failed to fetch search results:", err);
    return [];
  }
}


export async function fetchBrandProducts({
  brand,
  category = "laptops",
}: {
  brand: string;
  category?: string;
}) {
  try {
    const query = new URLSearchParams();
    query.append("brand", brand);
    if (category) query.append("category", category);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/brand?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "force-cache", // allow caching since brand laptops rarely change
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }

    const json = await res.json();
    // console.log(`Fetched ${json.data.length} products for brand: ${brand}`);
    return json.data || [];
  } catch (err) {
    console.error(`Failed to fetch brand products for ${brand}:`, err);
    return [];
  }
}



export async function fetchSingleProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/single/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-super-secure-key': `${process.env.API_SECRET_KEY}`
      },
      cache: 'no-cache'
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data; // Expected format: Product
  } catch (error) {
    // console.error('Failed to fetch single product:', error);
    return null; // Keep null for single product as it may be used differently
  }
}

export async function fetchOfferZoneProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/offer-zone`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-super-secure-key': `${process.env.API_SECRET_KEY}`
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // console.log("Featured Products", data)
    return data; // Expected format: Product[]
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return []; // Fallback to empty array
  }
}

export async function fetchNewArrivalsProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/new-arrivals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-super-secure-key': `${process.env.API_SECRET_KEY}`
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // console.log('New Arrivals data:', data)

    return data; // Expected format: Product[]
  } catch (error) {
    console.error('Failed to fetch new arrivals:', error);
    return []; // Fallback to empty array
  }
}

export async function fetchGamersZoneProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/gamers-zone`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-super-secure-key': `${process.env.API_SECRET_KEY}`
      },
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Initialize default structure if categories are missing

    // console.log('Gamers Zone data:', data)

    const categories = {
      consoles: data.consoles || [],
      accessories: data.accessories || [],
      laptops: data.laptops || [],
      'steering-chairs': data['steering-chairs'] || [],
    };

    return categories;
     // Expected format: { consoles: Product[], accessories: Product[], laptops: Product[], 'steering-chairs': Product[] }
  } catch (error) {
    console.error('Failed to fetch gamers zone products:', error);
    return {
      consoles: [],
      accessories: [],
      laptops: [],
      'steering-chairs': [],
    }; // Fallback to empty object
  }
}


