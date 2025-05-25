'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
        console.error('Error data:', errorData);
        throw new Error(errorData.error || 'Failed to create category');
      }

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

  if (loading) return <div>Loading presets...</div>;
  if (serverError && Object.keys(presets).length === 0) return <div>Error: {serverError}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Category</h1>
      {serverError && <div className="text-red-500 mb-4">{serverError}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />
          {errors.slug && <p className="text-red-500 text-sm">{errors.slug}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="preset">Preset</Label>
          <Select onValueChange={handlePresetChange} value={formData.preset}>
            <SelectTrigger>
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

        <div>
          <Label>Attributes</Label>
          {formData.attributes.map((attr, index) => (
            <div key={index} className="border p-4 mb-2 rounded space-y-2">
              <div>
                <Label htmlFor={`attribute-name-${index}`}>Name</Label>
                <Input
                  id={`attribute-name-${index}`}
                  value={attr.name}
                  onChange={(e) => {
                    const newAttributes = [...formData.attributes];
                    newAttributes[index].name = e.target.value;
                    setFormData({ ...formData, attributes: newAttributes });
                  }}
                />
                {errors.attributes?.[index]?.name && (
                  <p className="text-red-500 text-sm">{errors.attributes[index].name}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`attribute-type-${index}`}>Type</Label>
                <Select
                  value={attr.type}
                  onValueChange={(value) => {
                    const newAttributes = [...formData.attributes];
                    newAttributes[index].type = value as 'text' | 'number' | 'boolean' | 'select';
                    setFormData({ ...formData, attributes: newAttributes });
                  }}
                >
                  <SelectTrigger>
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
                  <Label htmlFor={`attribute-options-${index}`}>Options (comma-separated)</Label>
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
                    placeholder="e.g., Red, Blue, Green"
                  />
                </div>
              )}

              <div>
                <Label htmlFor={`attribute-unit-${index}`}>Unit (optional)</Label>
                <Input
                  id={`attribute-unit-${index}`}
                  value={attr.unit || ''}
                  onChange={(e) => {
                    const newAttributes = [...formData.attributes];
                    newAttributes[index].unit = e.target.value || undefined;
                    setFormData({ ...formData, attributes: newAttributes });
                  }}
                  placeholder="e.g., GHz, GB"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`attribute-filterable-${index}`}
                  checked={attr.isFilterable}
                  onCheckedChange={(checked) => {
                    const newAttributes = [...formData.attributes];
                    newAttributes[index].isFilterable = checked as boolean;
                    setFormData({ ...formData, attributes: newAttributes });
                  }}
                />
                <Label htmlFor={`attribute-filterable-${index}`}>Filterable</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`attribute-required-${index}`}
                  checked={attr.isRequired}
                  onCheckedChange={(checked) => {
                    const newAttributes = [...formData.attributes];
                    newAttributes[index].isRequired = checked as boolean;
                    setFormData({ ...formData, attributes: newAttributes });
                  }}
                />
                <Label htmlFor={`attribute-required-${index}`}>Required</Label>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={() => removeAttribute(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addCustomAttribute}>
            Add Attribute
          </Button>
        </div>

        <div>
          <Label>Subcategories</Label>
          {formData.subcategories.map((sub, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <Input
                value={sub}
                onChange={(e) => {
                  const newSubcategories = [...formData.subcategories];
                  newSubcategories[index] = e.target.value;
                  setFormData({ ...formData, subcategories: newSubcategories });
                }}
                placeholder="Subcategory name"
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
          <Button type="button" variant="outline" onClick={addCustomSubcategory}>
            Add Subcategory
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <div>
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="flex space-x-2">
          <Button type="submit">Create Category</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/categories')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}