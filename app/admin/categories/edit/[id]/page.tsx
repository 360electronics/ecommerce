'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  id: string;
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

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams();
  const [formData, setFormData] = useState<FormData>({
    id: id as string,
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
  const [openAttributes, setOpenAttributes] = useState<number[]>([]);
  const [openSubcategories, setOpenSubcategories] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const presetsResponse = await fetch('/api/categories');
        if (!presetsResponse.ok) {
          throw new Error('Failed to fetch presets');
        }
        const presetsData = await presetsResponse.json();
        setPresets(presetsData);

        const categoryResponse = await fetch(`/api/categories/${id}`);
        if (!categoryResponse.ok) {
          throw new Error('Failed to fetch category');
        }
        const categoryData = await categoryResponse.json();

        setFormData({
          id: categoryData.category.id,
          name: categoryData.category.name,
          slug: categoryData.category.slug,
          description: categoryData.category.description || '',
          imageUrl: categoryData.category.imageUrl || '',
          isActive: categoryData.category.isActive,
          displayOrder: parseInt(categoryData.category.displayOrder) || 0,
          preset: '',
          attributes: categoryData.attributes || [],
          subcategories: categoryData.subcategories.map((sub: { name: string }) => sub.name) || [],
        });
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
      subcategories: presetData.subcategories.map((sub) => sub.name) || [],
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
    setOpenAttributes([...openAttributes, formData.attributes.length]);
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
    setOpenAttributes(openAttributes.filter((i) => i !== index));
  };

  const addCustomSubcategory = () => {
    setFormData({
      ...formData,
      subcategories: [...formData.subcategories, ''],
    });
    setOpenSubcategories([...openSubcategories, formData.subcategories.length]);
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
    setOpenSubcategories(openSubcategories.filter((i) => i !== index));
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

      const payload = {
        id: formData.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
        attributes: formData.attributes,
        subcategoryNames: cleanedSubcategories,
      };

      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }

      router.push('/admin/categories');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (serverError && !formData.name) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className=" mx-auto p-6 ">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Category</h1>
      {serverError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  aria-required="true"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1"
                  aria-required="true"
                />
                {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">
                Image URL
              </Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="mt-1"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active
                </Label>
              </div>
              <div>
                <Label htmlFor="displayOrder" className="text-sm font-medium text-gray-700">
                  Display Order
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preset</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="preset" className="text-sm font-medium text-gray-700">
              Select Preset
            </Label>
            <Select onValueChange={handlePresetChange} value={formData.preset}>
              <SelectTrigger className="mt-1">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.attributes.map((attr, index) => (
              <Collapsible
                key={index}
                open={openAttributes.includes(index)}
                onOpenChange={(open:any) =>
                  setOpenAttributes(
                    open ? [...openAttributes, index] : openAttributes.filter((i) => i !== index)
                  )
                }
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    {attr.name || `Attribute ${index + 1}`}
                  </span>
                  {openAttributes.includes(index) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4 border rounded-md mt-2">
                  <div>
                    <Label htmlFor={`attribute-name-${index}`} className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
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
                      <p className="text-red-500 text-sm mt-1">{errors.attributes[index].name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`attribute-type-${index}`} className="text-sm font-medium text-gray-700">
                      Type
                    </Label>
                    <Select
                      value={attr.type}
                      onValueChange={(value) => {
                        const newAttributes = [...formData.attributes];
                        newAttributes[index].type = value as 'text' | 'number' | 'boolean' | 'select';
                        setFormData({ ...formData, attributes: newAttributes });
                      }}
                    >
                      <SelectTrigger className="mt-1">
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
                      <Label htmlFor={`attribute-options-${index}`} className="text-sm font-medium text-gray-700">
                        Options (comma-separated)
                      </Label>
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
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor={`attribute-unit-${index}`} className="text-sm font-medium text-gray-700">
                      Unit (optional)
                    </Label>
                    <Input
                      id={`attribute-unit-${index}`}
                      value={attr.unit || ''}
                      onChange={(e) => {
                        const newAttributes = [...formData.attributes];
                        newAttributes[index].unit = e.target.value || undefined;
                        setFormData({ ...formData, attributes: newAttributes });
                      }}
                      placeholder="e.g., GHz, GB"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor={`attribute-filterable-${index}`} className="text-sm font-medium text-gray-700">
                        Filterable
                      </Label>
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
                      <Label htmlFor={`attribute-required-${index}`} className="text-sm font-medium text-gray-700">
                        Required
                      </Label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeAttribute(index)}
                    className="w-full"
                  >
                    Remove Attribute
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            ))}
            <Button type="button" variant="outline" onClick={addCustomAttribute} className="w-full mt-2">
              Add Attribute
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subcategories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.subcategories.map((sub, index) => (
              <Collapsible
                key={index}
                open={openSubcategories.includes(index)}
                onOpenChange={(open:any) =>
                  setOpenSubcategories(
                    open ? [...openSubcategories, index] : openSubcategories.filter((i) => i !== index)
                  )
                }
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    {sub || `Subcategory ${index + 1}`}
                  </span>
                  {openSubcategories.includes(index) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4 border rounded-md mt-2">
                  <div>
                    <Label htmlFor={`subcategory-${index}`} className="text-sm font-medium text-gray-700">
                      Subcategory Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`subcategory-${index}`}
                        value={sub}
                        onChange={(e) => {
                          const newSubcategories = [...formData.subcategories];
                          newSubcategories[index] = e.target.value;
                          setFormData({ ...formData, subcategories: newSubcategories });
                        }}
                        placeholder="Subcategory name"
                        className="mt-1"
                        aria-required="true"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeSubcategory(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    {errors.subcategories?.[index] && (
                      <p className="text-red-500 text-sm mt-1">{errors.subcategories[index]}</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
            <Button type="button" variant="outline" onClick={addCustomSubcategory} className="w-full mt-2">
              Add Subcategory
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/categories')}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover">Update Category</Button>
        </div>
      </form>
    </div>
  );
}