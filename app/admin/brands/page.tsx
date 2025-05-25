// admin/brands/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type Brand = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      if (!response.ok) throw new Error('Failed to fetch brands');
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      toast.error('Error fetching brands');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBrandStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/brands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setBrands(brands.map((brand) => (brand.id === id ? { ...brand, isActive: !currentStatus } : brand)));
      toast.success('Brand status updated');
    } catch (error) {
      toast.error('Error updating brand status');
      console.error(error);
    }
  };

  const deleteBrand = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    try {
      const response = await fetch(`/api/brands/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete brand');
      setBrands(brands.filter((brand) => brand.id !== id));
      toast.success('Brand deleted');
    } catch (error) {
      toast.error('Error deleting brand');
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Brands</h1>
        <Link href="/admin/brands/add">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Add Brand
          </button>
        </Link>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Logo</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Slug</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} className="border-t">
                <td className="p-4">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} className="h-10 w-10 object-contain" />
                  ) : (
                    'No Logo'
                  )}
                </td>
                <td className="p-4">{brand.name}</td>
                <td className="p-4">{brand.slug}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded ${
                      brand.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {brand.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => toggleBrandStatus(brand.id, brand.isActive)}
                    className="text-blue-500 hover:underline"
                  >
                    {brand.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link href={`/admin/brands/edit/${brand.id}`} className="text-blue-500 hover:underline">
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteBrand(brand.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}