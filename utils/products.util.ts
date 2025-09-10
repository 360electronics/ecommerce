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


