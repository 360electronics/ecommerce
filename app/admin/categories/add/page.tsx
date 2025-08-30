'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast, Toaster } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

// Define types for form and preset data
type Preset = {
  category: { id: string; name: string; slug: string };
  attributes: Array<{
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    options?: string[];
    unit?: string;
    isFilterable: boolean;
    isRequired: boolean;
    displayOrder: number;
  }>;
  subcategories: Array<{ id: string; name: string; slug: string }>;
};

type FormData = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  preset: string;
  attributes: Array<{
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    options?: string[];
    unit?: string;
    isFilterable: boolean;
    isRequired: boolean;
    displayOrder: number;
  }>;
  subcategories: string[];
};

type Errors = {
  name?: string;
  slug?: string;
  attributes?: Array<{ name?: string }>;
  subcategories?: Array<string | undefined>;
};

export default function AddCategoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true,
    displayOrder: 0,
    preset: '',
    attributes: [],
    subcategories: [],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [presets, setPresets] = useState<Record<string, Preset>>({});
  const [loading, setLoading] = useState(true);

  // Fetch presets on mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch presets');
        }
        const data = await response.json();
        setPresets(data);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Failed to load presets');
      } finally {
        setLoading(false);
      }
    };
    fetchPresets();
  }, []);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove special chars
      .replace(/\s+/g, '-')         // replace spaces with dash
      .replace(/-+/g, '-');         // remove duplicate dashes


  const validateForm = (): Errors => {
    const newErrors: Errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }

    const attributeErrors = formData.attributes.map((attr) => ({
      name: attr.name.trim() ? undefined : 'Attribute name is required',
    }));
    if (attributeErrors.some((err) => err.name)) {
      newErrors.attributes = attributeErrors;
    }

    const validSubcategories = formData.subcategories.filter((sub) => sub.trim());
    const subcategoryErrors = formData.subcategories.map((sub) =>
      sub.trim() ? undefined : 'Subcategory name is required'
    );
    if (subcategoryErrors.some((err) => err) && validSubcategories.length === 0) {
      newErrors.subcategories = subcategoryErrors;
    }

    return newErrors;
  };

  const handlePresetChange = (value: string) => {
    const presetData = value ? presets[value] : { attributes: [], subcategories: [] };
    setFormData({
      ...formData,
      preset: value,
      attributes: presetData.attributes || [],
      subcategories: presetData.subcategories?.map((sub) => sub.name) || [],
    });
    setErrors({});
  };

  const addCustomAttribute = () => {
    setFormData({
      ...formData,
      attributes: [
        ...formData.attributes,
        {
          name: '',
          type: 'text',
          isFilterable: false,
          isRequired: false,
          displayOrder: formData.attributes.length,
        },
      ],
    });
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index),
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors.attributes) {
        newErrors.attributes = newErrors.attributes.filter((_, i) => i !== index);
      }
      return newErrors;
    });
  };

  const addCustomSubcategory = () => {
    setFormData({
      ...formData,
      subcategories: [...formData.subcategories, ''],
    });
  };

  const removeSubcategory = (index: number) => {
    setFormData({
      ...formData,
      subcategories: formData.subcategories.filter((_, i) => i !== index),
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors.subcategories) {
        newErrors.subcategories = newErrors.subcategories.filter((_, i) => i !== index);
      }
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const cleanedSubcategories = formData.subcategories.filter((sub) => sub.trim());

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          imageUrl: formData.imageUrl || undefined,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
          attributes: formData.attributes,
          subcategoryNames: cleanedSubcategories,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

      toast.success('Category created successfully');
      setFormData({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        isActive: true,
        displayOrder: 0,
        preset: '',
        attributes: [],
        subcategories: [],
      });
      setErrors({});
      setServerError(null);
      router.push('/admin/categories');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <span className="text-gray-600 text-lg">Loading presets...</span>
        </div>
      </div>
    );
  }

  if (serverError && Object.keys(presets).length === 0) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="text-red-500 bg-red-50 p-4 rounded-md border border-gray-200">
          Error: {serverError}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            className="border-gray-200 hover:bg-gray-100"
            onClick={() => router.push('/admin/categories')}
            aria-label="Back to categories"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Add New Category</h1>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {serverError && (
          <div className="text-red-500 bg-red-50 p-4 rounded-md border border-gray-200 mb-6">
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-gray-700">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value), // auto-generate slug
                  })
                }
                className="border-gray-200 focus:ring-2 focus:ring-primary"
                placeholder="Enter category name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="slug" className="text-gray-700">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                disabled // disable editing
                className="border-gray-200 focus:ring-2 focus:ring-primary bg-gray-100"
                placeholder="Slug will be generated automatically"
              />

              {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-gray-200 focus:ring-2 focus:ring-primary"
              placeholder="Enter category description"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="imageUrl" className="text-gray-700">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="border-gray-200 focus:ring-2 focus:ring-primary"
              placeholder="Enter image URL"
            />
          </div>

          <div>
            <Label htmlFor="preset" className="text-gray-700">Preset</Label>
            <Select onValueChange={handlePresetChange} value={formData.preset}>
              <SelectTrigger className="border-gray-200 focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Custom</SelectItem>
                {Object.values(presets).map((preset) => (
                  <SelectItem key={preset.category.slug} value={preset.category.slug}>
                    {preset.category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border border-gray-200 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Attributes</h2>
            {formData.attributes.map((attr, index) => (
              <div key={index} className="border border-gray-200 p-4 mb-4 rounded-md space-y-4">
                <div>
                  <Label htmlFor={`attribute-name-${index}`} className="text-gray-700">Name</Label>
                  <Input
                    id={`attribute-name-${index}`}
                    value={attr.name}
                    onChange={(e) => {
                      const newAttributes = [...formData.attributes];
                      newAttributes[index].name = e.target.value;
                      setFormData({ ...formData, attributes: newAttributes });
                    }}
                    className="border-gray-200 focus:ring-2 focus:ring-primary"
                    placeholder="Enter attribute name"
                  />
                  {errors.attributes?.[index]?.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.attributes[index].name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`attribute-type-${index}`} className="text-gray-700">Type</Label>
                  <Select
                    value={attr.type}
                    onValueChange={(value) => {
                      const newAttributes = [...formData.attributes];
                      newAttributes[index].type = value as 'text' | 'number' | 'boolean' | 'select';
                      setFormData({ ...formData, attributes: newAttributes });
                    }}
                  >
                    <SelectTrigger className="border-gray-200 focus:ring-2 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {attr.type === 'select' && (
                  <div>
                    <Label htmlFor={`attribute-options-${index}`} className="text-gray-700">Options (comma-separated)</Label>
                    <Input
                      id={`attribute-options-${index}`}
                      value={attr.options?.join(', ') || ''}
                      onChange={(e) => {
                        const options = e.target.value
                          .split(',')
                          .map((opt) => opt.trim())
                          .filter(Boolean);
                        const newAttributes = [...formData.attributes];
                        newAttributes[index].options = options;
                        setFormData({ ...formData, attributes: newAttributes });
                      }}
                      className="border-gray-200 focus:ring-2 focus:ring-primary"
                      placeholder="e.g., Red, Blue, Green"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor={`attribute-unit-${index}`} className="text-gray-700">Unit (optional)</Label>
                  <Input
                    id={`attribute-unit-${index}`}
                    value={attr.unit || ''}
                    onChange={(e) => {
                      const newAttributes = [...formData.attributes];
                      newAttributes[index].unit = e.target.value || undefined;
                      setFormData({ ...formData, attributes: newAttributes });
                    }}
                    className="border-gray-200 focus:ring-2 focus:ring-primary"
                    placeholder="e.g., GHz, GB"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`attribute-filterable-${index}`}
                      checked={attr.isFilterable}
                      onCheckedChange={(checked) => {
                        const newAttributes = [...formData.attributes];
                        newAttributes[index].isFilterable = checked === true;
                        setFormData({ ...formData, attributes: newAttributes });
                      }}
                      aria-label={`Filterable attribute ${index}`}
                    />
                    <Label htmlFor={`attribute-filterable-${index}`} className="text-gray-700">Filterable</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`attribute-required-${index}`}
                      checked={attr.isRequired}
                      onCheckedChange={(checked) => {
                        const newAttributes = [...formData.attributes];
                        newAttributes[index].isRequired = checked === true;
                        setFormData({ ...formData, attributes: newAttributes });
                      }}
                      aria-label={`Required attribute ${index}`}
                    />
                    <Label htmlFor={`attribute-required-${index}`} className="text-gray-700">Required</Label>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeAttribute(index)}
                  className="mt-2"
                >
                  Remove Attribute
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addCustomAttribute}
              className="border-gray-200 hover:bg-gray-100"
            >
              Add Attribute
            </Button>
          </div>

          <div className="border border-gray-200 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Subcategories</h2>
            {formData.subcategories.map((sub, index) => (
              <div key={index} className="flex items-center space-x-4 mb-4">
                <Input
                  value={sub}
                  onChange={(e) => {
                    const newSubcategories = [...formData.subcategories];
                    newSubcategories[index] = e.target.value;
                    setFormData({ ...formData, subcategories: newSubcategories });
                  }}
                  className="border-gray-200 focus:ring-2 focus:ring-primary"
                  placeholder="Enter subcategory name"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeSubcategory(index)}
                >
                  Remove
                </Button>
                {errors.subcategories?.[index] && (
                  <p className="text-red-500 text-sm">{errors.subcategories[index]}</p>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addCustomSubcategory}
              className="border-gray-200 hover:bg-gray-100"
            >
              Add Subcategory
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                aria-label="Active category"
              />
              <Label htmlFor="isActive" className="text-gray-700">Active</Label>
            </div>

            <div>
              <Label htmlFor="displayOrder" className="text-gray-700">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="border-gray-200 focus:ring-2 focus:ring-primary"
                placeholder="Enter display order"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" className="bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover">
              Create Category
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/categories')}
              className="border-gray-200 hover:bg-gray-100"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}