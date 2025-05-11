
export async function fetchUsers() {
    try {
      const res = await fetch('/api/users', {
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
      console.error('Failed to fetch users:', error)
      return null
    }
  }