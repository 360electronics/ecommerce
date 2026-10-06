// Client-side admin product helpers (called directly from the browser so the
// admin session cookie is sent — no server-action round trip).

export async function fetchAdminProductOptions() {
  try {
    const res = await fetch("/api/admin/products/options", { cache: "no-store" });
    if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
    return await res.json(); // { data: Product[] }
  } catch (error) {
    console.error("Failed to fetch admin product options:", error);
    return { data: [] };
  }
}
