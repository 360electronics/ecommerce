

export async function fetchProducts() {
    try {
      const res = await fetch('/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
  
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`)
      }
  
      const data = await res.json()
      return data
    } catch (error) {
      console.error('Failed to fetch products:', error)
      return null
    }
  }

export async function fetchFeaturedProducts() {
    try {
      const res = await fetch('/api/products/featured', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
  
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`)
      }
  
      const data = await res.json()
      return data
    } catch (error) {
      console.error('Failed to fetch products:', error)
      return null
    }
  }
  

export async function fetchNewArrivalsProducts() {
    try {
      const res = await fetch('/api/products/new-arrivals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
  
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`)
      }
  
      const data = await res.json()
      return data
    } catch (error) {
      console.error('Failed to fetch products:', error)
      return null
    }
  }
  
export const deleteProducts = async (ids: number[]) => {
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
  
      if (!res.ok) {
        throw new Error(`Failed to delete products. Status: ${res.status}`);
      }
  
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Delete request failed:', error);
      return null;
    }
  };
  