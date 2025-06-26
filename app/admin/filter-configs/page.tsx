'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface Attribute {
  name: string | null;
  type: 'text' | 'number' | 'boolean' | 'select' | null;
  options?: string[] | null;
  unit?: string | null;
  isFilterable: boolean | null;
  isRequired: boolean | null;
  displayOrder: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: string;
  attributes: Attribute[];
  subcategories: { id: string; name: string; slug: string }[];
}

const FilterConfigPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        const categoryList = Object.values(data).map((cat: any) => ({
          id: cat.category.id,
          name: cat.category.name,
          slug: cat.category.slug,
          description: cat.category.description,
          isActive: cat.category.isActive,
          displayOrder: cat.category.displayOrder,
          attributes: cat.attributes,
          subcategories: cat.subcategories,
        }));
        setCategories(categoryList);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Load category data when selected
  useEffect(() => {
    if (selectedCategoryId) {
      const selected = categories.find((cat) => cat.id === selectedCategoryId);
      if (selected) {
        setCategoryData(selected);
        setAttributes(selected.attributes.map((attr) => ({
          ...attr,
          name: attr.name || '',
          type: attr.type || 'text',
          isFilterable: attr.isFilterable ?? false,
          isRequired: attr.isRequired ?? false,
          displayOrder: attr.displayOrder ?? 1,
        })));
      }
    } else {
      setCategoryData(null);
      setAttributes([]);
    }
  }, [selectedCategoryId, categories]);

  const handleAttributeChange = (index: number, field: keyof Attribute, value: any) => {
    setAttributes((prev) => {
      const newAttributes = [...prev];
      if (field === 'options') {
        newAttributes[index] = { ...newAttributes[index], options: value.split(',').map((opt: string) => opt.trim()).filter(Boolean) };
      } else {
        newAttributes[index] = { ...newAttributes[index], [field]: value };
      }
      return newAttributes;
    });
  };

  const addAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      {
        name: '',
        type: 'text',
        options: [],
        unit: '',
        isFilterable: true,
        isRequired: false,
        displayOrder: prev.length + 1,
      },
    ]);
  };

  const removeAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryData) return;

    try {
      // Validate attributes
      for (const attr of attributes) {
        if (!attr.name) throw new Error('Attribute name is required');
        if (!attr.type) throw new Error('Attribute type is required');
        if (attr.type === 'select' && (!attr.options || attr.options.length === 0)) {
          throw new Error(`Options are required for select attribute: ${attr.name}`);
        }
        if (attr.displayOrder === null || attr.displayOrder < 1) {
          throw new Error(`Invalid display order for attribute: ${attr.name}`);
        }
      }

      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryData.id,
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          isActive: categoryData.isActive,
          displayOrder: Number(categoryData.displayOrder),
          attributes,
          subcategoryNames: categoryData.subcategories.map((sub) => sub.name),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }

      const updatedCategory = await response.json();
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === updatedCategory.category.id
            ? { ...cat, attributes: updatedCategory.category.attributes }
            : cat
        )
      );
      setError(null);
      alert('Filter configuration updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update filter configuration');
      console.error('Error updating filter config:', err);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Filter Configurations</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Category selector */}
      <div className="mb-6">
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Select Category</label>
        <select
          id="categoryId"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Attributes form */}
      {categoryData && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Attributes for {categoryData.name}</h2>
          {attributes.map((attr, index) => (
            <div key={index} className="border p-4 rounded mb-4 relative">
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                aria-label="Remove attribute"
              >
                <Trash2 size={20} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`attr-name-${index}`} className="block text-sm font-medium text-gray-700">Attribute Name</label>
                  <input
                    id={`attr-name-${index}`}
                    value={attr.name || ''}
                    onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`attr-type-${index}`} className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    id={`attr-type-${index}`}
                    value={attr.type || 'text'}
                    onChange={(e) => handleAttributeChange(index, 'type', e.target.value as Attribute['type'])}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`attr-unit-${index}`} className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    id={`attr-unit-${index}`}
                    value={attr.unit || ''}
                    onChange={(e) => handleAttributeChange(index, 'unit', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor={`attr-displayOrder-${index}`} className="block text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    id={`attr-displayOrder-${index}`}
                    type="number"
                    value={attr.displayOrder ?? 1}
                    onChange={(e) => handleAttributeChange(index, 'displayOrder', Number(e.target.value))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min={1}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id={`attr-isFilterable-${index}`}
                    type="checkbox"
                    checked={attr.isFilterable ?? false}
                    onChange={(e) => handleAttributeChange(index, 'isFilterable', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`attr-isFilterable-${index}`} className="ml-2 text-sm text-gray-600">Filterable</label>
                </div>
                <div className="flex items-center">
                  <input
                    id={`attr-isRequired-${index}`}
                    type="checkbox"
                    checked={attr.isRequired ?? false}
                    onChange={(e) => handleAttributeChange(index, 'isRequired', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`attr-isRequired-${index}`} className="ml-2 text-sm text-gray-600">Required</label>
                </div>
              </div>
              {attr.type === 'select' && (
                <div className="mt-4">
                  <label htmlFor={`attr-options-${index}`} className="block text-sm font-medium text-gray-700">Options (comma-separated)</label>
                  <input
                    id={`attr-options-${index}`}
                    value={attr.options?.join(', ') || ''}
                    onChange={(e) => handleAttributeChange(index, 'options', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Option1, Option2, Option3"
                    required
                  />
                </div>
              )}
              {attr.type === 'number' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor={`attr-min-${index}`} className="block text-sm font-medium text-gray-700">Min Value</label>
                    <input
                      id={`attr-min-${index}`}
                      type="number"
                      value={attr.options?.[0] || ''}
                      onChange={(e) => handleAttributeChange(index, 'options', [e.target.value, attr.options?.[1] || ''])}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`attr-max-${index}`} className="block text-sm font-medium text-gray-700">Max Value</label>
                    <input
                      id={`attr-max-${index}`}
                      type="number"
                      value={attr.options?.[1] || ''}
                      onChange={(e) => handleAttributeChange(index, 'options', [attr.options?.[0] || '', e.target.value])}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addAttribute}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <Plus size={20} className="mr-1" /> Add Attribute
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!categoryData}
          >
            Save Configuration
          </button>
        </form>
      )}

      {/* List of existing configs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Existing Filter Configurations</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filterable Attributes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {cat.attributes
                    .filter((attr) => attr.isFilterable)
                    .map((attr) => attr.name)
                    .join(', ') || 'None'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FilterConfigPage;