// app/admin/category/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  displayOrder: string;
  attributes: Array<{
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    isFilterable: boolean;
    isRequired: boolean;
    displayOrder: number;
  }>;
  subcategories: Array<{ id: string; name: string; slug: string }>;
}

export default function CategoryListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();

        // Transform the object into an array of Category objects
        const categoryArray: Category[] = Object.values(data).map((preset: any) => ({
          id: preset.category.id,
          name: preset.category.name,
          slug: preset.category.slug,
          description: preset.category.description,
          isActive: preset.category.isActive,
          displayOrder: preset.category.displayOrder,
          attributes: preset.attributes || [],
          subcategories: preset.subcategories || [], // Use subcategories as-is (array of { id, name, slug })
        }));

        setCategories(categoryArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <Link href="/admin/categories/add">
          <Button>Add Category</Button>
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Attributes</TableHead>
            <TableHead>Subcategories</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.slug}</TableCell>
              <TableCell>
                {category.attributes.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {category.attributes.map((attr) => (
                      <li key={attr.name}>
                        {attr.name} ({attr.type}, {attr.isFilterable ? 'Filterable' : 'Non-filterable'},{' '}
                        {attr.isRequired ? 'Required' : 'Optional'})
                      </li>
                    ))}
                  </ul>
                ) : (
                  'None'
                )}
              </TableCell>
              <TableCell>
                {category.subcategories.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {category.subcategories.map((sub) => (
                      <li key={sub.id}>{sub.name}</li>
                    ))}
                  </ul>
                ) : (
                  'None'
                )}
              </TableCell>
              <TableCell>{category.isActive ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/categories/edit/${category.id}`)} // Fixed path
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}