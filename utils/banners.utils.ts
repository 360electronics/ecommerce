const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function fetchBanners() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/banner`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
  
      const data = await res.json();
      console.log('fetchBanners response:', data); 
      return data; // Expected format: { data: Banner[] }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      return { data: [] }; // Fallback to empty banners object
    }
  }