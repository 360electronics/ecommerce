// Called from client components: fetch the API directly from the browser
// (relative URL). This used to be a "use server" module, which turned every
// call into browser → server action → HTTP back to our own API.
const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
    : "";

export interface QuickSuggestion {
  id: string;
  title: string;
  image?: string;
  price?: string;
  description: string;
}

// ⚡ 1. ULTRA-FAST: Prefix + LIKE search (returns < 20ms)
export async function fetchQuickSuggestions(query: string): Promise<QuickSuggestion[]> {
  try {
    if (!query.trim()) return [];
    
    const params = new URLSearchParams({ q: query.trim(), limit: "10", type: "quick" });
    const res = await fetch(`${API_BASE_URL}/api/products/search?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store", 
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Quick suggestions failed:", err);
    return [];
  }
}

export async function fetchOfferZoneProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/offer-zone`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // console.log("Featured Products", data)
    return data; // Expected format: Product[]
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return []; // Fallback to empty array
  }
}

export async function fetchNewArrivalsProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/new-arrivals`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // console.log('New Arrivals data:', data)

    return data; // Expected format: Product[]
  } catch (error) {
    console.error("Failed to fetch new arrivals:", error);
    return []; // Fallback to empty array
  }
}

export async function fetchGamersZoneProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/gamers-zone`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
      "steering-chairs": data["steering-chairs"] || [],
    };

    return categories;
    // Expected format: { consoles: Product[], accessories: Product[], laptops: Product[], 'steering-chairs': Product[] }
  } catch (error) {
    console.error("Failed to fetch gamers zone products:", error);
    return {
      consoles: [],
      accessories: [],
      laptops: [],
      "steering-chairs": [],
    }; // Fallback to empty object
  }
}
