'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-hot-toast';
import { slugify } from '@/utils/slugify';

// Interfaces (unchanged)
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  displayOrder: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface Attribute {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  isFilterable: boolean;
  isRequired: boolean;
  displayOrder: number;
  options?: string[] | null;
  unit?: string | null;
}

interface CustomAttribute {
  name: string;
  value: string;
  type: 'text';
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder: number;
}

interface CategoryPreset {
  category: Category;
  attributes: Attribute[];
  subcategories: Subcategory[];
}

interface CategoryResponse {
  [slug: string]: CategoryPreset;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface SpecField {
  id: string;
  label: string;
  value: string;
}

interface SpecSection {
  id: string;
  name: string;
  fields: SpecField[];
  isRequired?: boolean;
  isFixed?: boolean;
}

interface ProductImage {
  url: string;
  alt: string;
  isFeatured: boolean;
  displayOrder: number;
}

interface Variant {
  id: string;
  name: string;
  sku: string;
  attributes: Record<string, string | number | boolean>;
  stock: string;
  lowStockThreshold: string;
  isBackorderable: boolean;
  mrp: string;
  ourPrice: string;
  salePrice: string;
  isOnSale: boolean;
  imageFiles: File[];
  existingImages: ProductImage[];
  weight: string;
  weightUnit: string;
  dimensions: { length: number; width: number; height: number; unit: string };
  isDefault: boolean;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'discontinued', label: 'Discontinued' },
];

const deliveryModeOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express' },
  { value: 'same_day', label: 'Same Day' },
  { value: 'pickup', label: 'Pickup' },
];

// DraggableSpecSection (fixed drag-and-drop)
const DraggableSpecSection = ({
  section,
  index,
  moveSection,
  handleSpecFieldChange,
  addFieldToSection,
  updateSectionName,
  removeSection,
  removeFieldFromSection,
}: {
  section: SpecSection;
  index: number;
  moveSection: (dragIndex: number, hoverIndex: number) => void;
  handleSpecFieldChange: (sectionId: string, fieldId: string, type: 'label' | 'value', value: string) => void;
  addFieldToSection: (sectionId: string) => void;
  updateSectionName: (sectionId: string, name: string) => void;
  removeSection: (sectionId: string) => void;
  removeFieldFromSection: (sectionId: string, fieldId: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const canDrag = !section.isFixed;

  const [{ isDragging }, drag] = useDrag({
    type: 'SPEC_SECTION',
    item: () => ({ index, id: section.id, type: 'SPEC_SECTION' }),
    canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'SPEC_SECTION',
    canDrop: (item: DragItem) => !section.isFixed && item.id !== 'general' && item.id !== 'warranty',
    hover: (item: DragItem, monitor) => {
      if (!ref.current || item.index === index || section.isFixed) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      moveSection(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drag(drop(ref));

  const borderStyle = isOver && canDrop ? 'border-blue-400' : isOver && !canDrop ? 'border-red-400' : 'border-gray-200';

  return (
    <div
      ref={ref}
      className={`rounded-md border p-4 transition-colors ${borderStyle} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ cursor: canDrag ? 'move' : 'default' }}
    >
      <div className="mb-4 flex items-center justify-between">
        {section.id === 'general' ? (
          <h3 className="font-medium">
            General <span className="text-xs text-red-500">(Required)</span>
          </h3>
        ) : section.id === 'warranty' ? (
          <h3 className="font-medium">Warranty</h3>
        ) : (
          <div className="flex items-center space-x-2 w-full">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            <Input
              value={section.name}
              onChange={(e) => updateSectionName(section.id, e.target.value)}
              placeholder="Section Name"
              className="h-8"
            />
            <button type="button" onClick={() => removeSection(section.id)} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {section.fields.map((field) => (
          <div key={field.id} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              placeholder={`Label (e.g. ${section.name === 'General' ? 'Model Name' : section.name === 'Warranty' ? 'Warranty Period' : 'Processor'})`}
              value={field.label}
              onChange={(e) => handleSpecFieldChange(section.id, field.id, 'label', e.target.value)}
            />
            <div className="flex items-center">
              <Input
                placeholder={`Value (e.g. ${section.name === 'General' ? 'ProBook 450' : section.name === 'Warranty' ? '1 Year' : 'Intel i7'})`}
                value={field.value}
                onChange={(e) => handleSpecFieldChange(section.id, field.id, 'value', e.target.value)}
                className="flex-1"
              />
              {section.fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFieldFromSection(section.id, field.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Button type="button" variant="outline" size="sm" onClick={() => addFieldToSection(section.id)}>
          Add Field
        </Button>
      </div>
    </div>
  );
};

export default function EditProductPage({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState({
    shortName: '',
    fullName: '',
    category: '',
    subcategory: '',
    brand: '',
    description: '',
    status: 'active',
    isFeatured: false,
    deliveryMode: 'standard',
    tags: '',
    warranty: '',
    metaTitle: '',
    metaDescription: '',
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [customAttributes, setCustomAttributes] = useState<{ [variantId: string]: CustomAttribute[] }>({});
  const [specSections, setSpecSections] = useState<SpecSection[]>([
    {
      id: 'general',
      name: 'General',
      fields: [
        { id: 'field1', label: 'Brand', value: '' },
        { id: 'field2', label: 'Model', value: '' },
      ],
      isRequired: true,
      isFixed: true,
    },
    {
      id: 'warranty',
      name: 'Warranty',
      fields: [{ id: 'field1', label: 'Warranty Period', value: '' }],
      isFixed: true,
    },
  ]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categoryPresets, setCategoryPresets] = useState<CategoryResponse | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ [variantId: string]: string[] }>({});
  const variantImageInputRefs = useRef<{
    [variantId: string]: { main: React.RefObject<HTMLInputElement | null>; additional: (HTMLInputElement | null)[] };
  }>({});

  // Decode and validate ID
 

  // Fetch data
  useEffect(() => {
    if (!id) {
      console.log("Invalid product ID", id)
      setError('Invalid product ID');
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch categories
        const categoryResponse = await fetch('/api/categories');
        if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
        const categoryData: CategoryResponse = await categoryResponse.json();
        setCategoryPresets(categoryData);

        // Fetch brands
        const brandResponse = await fetch('/api/brands');
        if (!brandResponse.ok) throw new Error('Failed to fetch brands');
        const brandData: Brand[] = await brandResponse.json();
        setBrands(brandData);

        // Fetch product data
        const productResponse = await fetch(`/api/products/edit/${id}`);
        if (!productResponse.ok) {
          if (productResponse.status === 404) throw new Error('Product not found');
          throw new Error('Failed to fetch product');
        }
        const data = await productResponse.json();

        // Set product data
        setProduct({
          shortName: data.shortName || '',
          fullName: data.fullName || '',
          category: data.category?.slug || '',
          subcategory: data.subcategory?.name || '',
          brand: data.brand?.name || '',
          description: data.description || '',
          status: data.status || 'active',
          isFeatured: data.isFeatured || false,
          deliveryMode: data.deliveryMode || 'standard',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '',
          warranty: data.warranty || '',
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
        });

        // Set variants
        const fetchedVariants = Array.isArray(data.variants) && data.variants.length > 0
          ? data.variants.map((variant: any, index: number) => ({
              id: `variant-${Date.now()}-${index}`,
              name: variant.name || '',
              sku: variant.sku || '',
              attributes: variant.attributes || {},
              stock: variant.stock?.toString() || '0',
              lowStockThreshold: variant.lowStockThreshold?.toString() || '5',
              isBackorderable: variant.isBackorderable || false,
              mrp: variant.mrp?.toString() || '',
              ourPrice: variant.ourPrice?.toString() || '',
              salePrice: variant.salePrice?.toString() || '',
              isOnSale: variant.isOnSale || false,
              imageFiles: [],
              existingImages: Array.isArray(variant.productImages)
                ? variant.productImages.map((img: any, idx: number) => ({
                    url: img.url,
                    alt: img.alt || `Image ${idx + 1}`,
                    isFeatured: img.isFeatured || idx === 0,
                    displayOrder: img.displayOrder || idx,
                  }))
                : [],
              weight: variant.weight?.toString() || '',
              weightUnit: variant.weightUnit || 'kg',
              dimensions: variant.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' },
              isDefault: variant.isDefault || index === 0,
            }))
          : [
              {
                id: `variant-${Date.now()}`,
                name: '',
                sku: '',
                attributes: {},
                stock: '0',
                lowStockThreshold: '5',
                isBackorderable: false,
                mrp: '',
                ourPrice: '',
                salePrice: '',
                isOnSale: false,
                imageFiles: [],
                existingImages: [],
                weight: '',
                weightUnit: 'kg',
                dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
                isDefault: true,
              },
            ];
        setVariants(fetchedVariants);

        // Set preview URLs for existing images
        const initialPreviewUrls: { [variantId: string]: string[] } = {};
        fetchedVariants.forEach((variant: Variant) => {
          initialPreviewUrls[variant.id] = variant.existingImages.map((img) => img.url);
        });
        setPreviewUrls(initialPreviewUrls);

        // Set specifications
        const initialSpecSections = [
          {
            id: 'general',
            name: 'General',
            fields: [
              { id: 'field1', label: 'Brand', value: data.brand?.name || '' },
              { id: 'field2', label: 'Model', value: '' },
            ],
            isRequired: true,
            isFixed: true,
          },
          {
            id: 'warranty',
            name: 'Warranty',
            fields: [{ id: 'field1', label: 'Warranty Period', value: data.warranty || '' }],
            isFixed: true,
          },
        ];

        if (data.specifications && Array.isArray(data.specifications)) {
          const newSpecSections = [...initialSpecSections];
          data.specifications.forEach((spec: any, index: number) => {
            if (!spec.groupName) return;
            const existingSectionIndex = newSpecSections.findIndex(
              (section) => section.name.toLowerCase() === spec.groupName.toLowerCase()
            );
            const fields = Array.isArray(spec.fields)
              ? spec.fields.map((field: any, idx: number) => ({
                  id: `field${idx + 1}-${spec.groupName}-${index}`,
                  label: field.fieldName || '',
                  value: field.fieldValue || '',
                }))
              : [];
            if (existingSectionIndex >= 0) {
              newSpecSections[existingSectionIndex].fields = fields.length > 0 ? fields : newSpecSections[existingSectionIndex].fields;
            } else {
              newSpecSections.push({
                id: `section-${spec.groupName}-${index}`,
                name: spec.groupName,
                fields,
                isFixed: false,
              });
            }
          });
          setSpecSections(newSpecSections);
        } else {
          setSpecSections(initialSpecSections);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Sync variant attributes with category presets
  useEffect(() => {
    if (!categoryPresets || !product.category) return;

    setVariants((prev) =>
      prev.map((variant) => {
        const presetAttributes = categoryPresets[product.category]?.attributes || [];
        const initialAttributes: Record<string, string | number | boolean> = {};
        presetAttributes.forEach((attr) => {
          if (!(attr.name in variant.attributes)) {
            initialAttributes[attr.name] = attr.type === 'boolean' ? false : attr.type === 'number' ? 0 : '';
          }
        });
        return {
          ...variant,
          attributes: { ...initialAttributes, ...variant.attributes },
        };
      })
    );

    // Initialize custom attributes for new variants
    const newCustomAttributes = { ...customAttributes };
    variants.forEach((variant) => {
      if (!newCustomAttributes[variant.id]) {
        const presetAttrNames = categoryPresets[product.category]?.attributes.map((a) => a.name) || [];
        const customAttrs: CustomAttribute[] = [];
        Object.entries(variant.attributes).forEach(([key, value], index) => {
          if (!presetAttrNames.includes(key)) {
            const stringValue =
              typeof value === 'string' ? value :
              typeof value === 'number' ? value.toString() :
              typeof value === 'boolean' ? value.toString() : '';
            customAttrs.push({
              name: key,
              value: stringValue,
              type: 'text',
              isRequired: false,
              isFilterable: false,
              displayOrder: index + 1,
            });
          }
        });
        newCustomAttributes[variant.id] = customAttrs;
      }
    });
    setCustomAttributes(newCustomAttributes);
  }, [categoryPresets, product.category, variants]);

  // Sync product fields
  useEffect(() => {
    setSpecSections((prev) =>
      prev.map((section) => {
        if (section.id === 'general') {
          return {
            ...section,
            fields: section.fields.map((field) =>
              field.label.toLowerCase() === 'brand' ? { ...field, value: product.brand } : field
            ),
          };
        } else if (section.id === 'warranty') {
          return {
            ...section,
            fields: section.fields.map((field) => ({ ...field, value: product.warranty })),
          };
        }
        return section;
      })
    );
  }, [product.brand, product.warranty]);

  // Initialize refs
  useEffect(() => {
    variants.forEach((variant) => {
      if (!variantImageInputRefs.current[variant.id]) {
        variantImageInputRefs.current[variant.id] = {
          main: React.createRef<HTMLInputElement>(),
          additional: Array(5).fill(null).map(() => null),
        };
      }
    });
    Object.keys(variantImageInputRefs.current).forEach((variantId) => {
      if (!variants.find((v) => v.id === variantId)) {
        delete variantImageInputRefs.current[variantId];
      }
    });
  }, [variants]);

  // Dropdown handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // Image handling
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (variantId: string, index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setVariants((prev) =>
        prev.map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
                imageFiles: [
                  ...variant.imageFiles.slice(0, index),
                  file,
                  ...variant.imageFiles.slice(index + 1),
                ],
              }
            : variant
        )
      );
      const previewUrl = await fileToBase64(file);
      setPreviewUrls((prev) => ({
        ...prev,
        [variantId]: [...(prev[variantId] || []).slice(0, index), previewUrl, ...(prev[variantId] || []).slice(index + 1)],
      }));
    }
  };

  const handleImageDrop = async (variantId: string, index: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setVariants((prev) =>
        prev.map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
                imageFiles: [
                  ...variant.imageFiles.slice(0, index),
                  file,
                  ...variant.imageFiles.slice(index + 1),
                ],
              }
            : variant
        )
      );
      const previewUrl = await fileToBase64(file);
      setPreviewUrls((prev) => ({
        ...prev,
        [variantId]: [...(prev[variantId] || []).slice(0, index), previewUrl, ...(prev[variantId] || []).slice(index + 1)],
      }));
    }
  };

  const removeImage = (variantId: string, index: number) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              imageFiles: [...variant.imageFiles.slice(0, index), ...variant.imageFiles.slice(index + 1)],
              existingImages: [...variant.existingImages.slice(0, index), ...variant.existingImages.slice(index + 1)],
            }
          : variant
      )
    );
    setPreviewUrls((prev) => ({
      ...prev,
      [variantId]: [...(prev[variantId] || []).slice(0, index), ...(prev[variantId] || []).slice(index + 1)],
    }));
  };

  // Variant handling
  const handleVariantChange = (id: string, field: keyof Variant, value: any) => {
    setVariants((prev) =>
      prev.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant))
    );
  };

  const handleAttributeChange = (variantId: string, attrName: string, value: string | number | boolean) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              attributes: { ...variant.attributes, [attrName]: value },
            }
          : variant
      )
    );
  };

  const addCustomAttribute = (variantId: string) => {
    setCustomAttributes((prev) => ({
      ...prev,
      [variantId]: [
        ...(prev[variantId] || []),
        {
          name: '',
          value: '',
          type: 'text' as const,
          isRequired: false,
          isFilterable: false,
          displayOrder: (prev[variantId]?.length || 0) + 1,
        },
      ],
    }));
  };

  const updateCustomAttribute = (variantId: string, index: number, field: keyof CustomAttribute, value: any) => {
    setCustomAttributes((prev) => ({
      ...prev,
      [variantId]: prev[variantId].map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)),
    }));
  };

  const removeCustomAttribute = (variantId: string, index: number) => {
    setCustomAttributes((prev) => ({
      ...prev,
      [variantId]: prev[variantId].filter((_, i) => i !== index),
    }));
  };

  const addVariant = () => {
    const newVariantId = `variant-${Date.now()}`;
    const presetAttributes = (product.category && categoryPresets?.[product.category]?.attributes) || [];
    const initialAttributes: Record<string, string | number | boolean> = {};
    presetAttributes.forEach((attr) => {
      initialAttributes[attr.name] = attr.type === 'boolean' ? false : attr.type === 'number' ? 0 : '';
    });
    setVariants((prev) => [
      ...prev,
      {
        id: newVariantId,
        name: '',
        sku: '',
        attributes: initialAttributes,
        stock: '0',
        lowStockThreshold: '5',
        isBackorderable: false,
        mrp: '',
        ourPrice: '',
        salePrice: '',
        isOnSale: false,
        imageFiles: [],
        existingImages: [],
        weight: '',
        weightUnit: 'kg',
        dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
        isDefault: prev.length === 0,
      },
    ]);
    setCustomAttributes((prev) => ({
      ...prev,
      [newVariantId]: [],
    }));
  };

  const removeVariant = (id: string) => {
    if (variants.length === 1) {
      toast.error('At least one variant is required');
      return;
    }
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
    setCustomAttributes((prev) => {
      const newCustom = { ...prev };
      delete newCustom[id];
      return newCustom;
    });
  };

  // Specification handling
  const handleSpecFieldChange = (sectionId: string, fieldId: string, type: 'label' | 'value', value: string) => {
    setSpecSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map((field) =>
                field.id === fieldId ? { ...field, [type]: value } : field
              ),
            }
          : section
      )
    );
  };

  const addFieldToSection = (sectionId: string) => {
    setSpecSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: [
                ...section.fields,
                { id: `field${section.fields.length + 1}-${Date.now()}`, label: '', value: '' },
              ],
            }
          : section
      )
    );
  };

  const removeFieldFromSection = (sectionId: string, fieldId: string) => {
    setSpecSections((prev) =>
      prev.map((section) =>
        section.id === sectionId && section.fields.length > 1
          ? {
              ...section,
              fields: section.fields.filter((field) => field.id !== fieldId),
            }
          : section
      )
    );
  };

  const updateSectionName = (sectionId: string, name: string) => {
    setSpecSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, name } : section))
    );
  };

  const removeSection = (sectionId: string) => {
    if (sectionId === 'general' || sectionId === 'warranty') return;
    setSpecSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const addNewSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      fields: [{ id: `field1-${Date.now()}`, label: '', value: '' }],
      isFixed: false,
    };
    setSpecSections((prev) => [...prev, newSection]);
  };

  const moveSection = (dragIndex: number, hoverIndex: number) => {
    const dragSection = specSections[dragIndex];
    if (dragSection.isFixed || specSections[hoverIndex].isFixed) return;
    setSpecSections((prev) => {
      const newSections = [...prev];
      newSections.splice(dragIndex, 1);
      newSections.splice(hoverIndex, 0, dragSection);
      return newSections;
    });
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!id) {
      toast.error('Invalid product ID');
      return;
    }
  
    // Validations
    if (!product.shortName.trim()) {
      toast.error('Short name is required');
      return;
    }
    if (!product.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!product.category) {
      toast.error('Category is required');
      return;
    }
    if (!product.brand) {
      toast.error('Brand is required');
      return;
    }
  
    const presetAttributes = (product.category && categoryPresets?.[product.category]?.attributes) || [];
  
    const validVariants = variants.filter((v) => {
      const requiredAttributesFilled = presetAttributes
        .filter((attr) => attr.isRequired)
        .every((attr) => v.attributes[attr.name] !== '' && v.attributes[attr.name] !== undefined);
      return (
        v.name.trim() &&
        v.sku.trim() &&
        v.mrp.trim() &&
        !isNaN(Number(v.mrp)) &&
        Number(v.mrp) > 0 &&
        v.ourPrice.trim() &&
        !isNaN(Number(v.ourPrice)) &&
        Number(v.ourPrice) > 0 &&
        !isNaN(Number(v.stock)) &&
        Number(v.stock) >= 0 &&
        (v.imageFiles.length > 0 || v.existingImages.length > 0) &&
        requiredAttributesFilled
      );
    });
  
    if (validVariants.length === 0) {
      toast.error('At least one valid variant with all required fields, attributes, and at least one image is required');
      return;
    }
  
    const generalSection = specSections.find((s) => s.id === 'general');
    if (!generalSection?.fields.some((f) => f.label.trim() && f.value.trim())) {
      toast.error('General section requires at least one field');
      return;
    }
  
    const formData = new FormData();
    formData.append('id', id);
    formData.append('shortName', product.shortName);
    formData.append('fullName', product.fullName);
    formData.append('slug', slugify(product.fullName));
    formData.append('category', product.category);
    formData.append(
      'subcategory',
      product.subcategory && categoryPresets && categoryPresets[product.category]
        ? categoryPresets[product.category].subcategories.find((sub) => sub.name === product.subcategory)?.slug || ''
        : ''
    );
    formData.append('brand', product.brand);
    formData.append('description', product.description || '');
    formData.append('status', product.status);
    formData.append('isFeatured', product.isFeatured ? 'true' : 'false');
    formData.append('deliveryMode', product.deliveryMode);
    formData.append('tags', product.tags || '');
    formData.append('warranty', product.warranty || '');
    formData.append('metaTitle', product.metaTitle || '');
    formData.append('metaDescription', product.metaDescription || '');
    formData.append('totalStocks', validVariants.reduce((sum, v) => sum + Number(v.stock), 0).toString());
  
    const variantsPayload = validVariants.map((v) => {
      const combinedAttributes = { ...v.attributes };
      customAttributes[v.id]?.forEach((attr) => {
        if (attr.name && attr.value !== '') {
          combinedAttributes[attr.name] = attr.value;
        }
      });
      return {
        id: v.id.startsWith('variant-') ? undefined : v.id,
        name: v.name,
        sku: v.sku,
        slug: slugify(v.name),
        attributes: combinedAttributes,
        isBackorderable: v.isBackorderable,
        mrp: Number(v.mrp).toString(),
        ourPrice: Number(v.ourPrice).toString(),
        stock: Number(v.stock).toString(),
        lowStockThreshold: Number(v.lowStockThreshold).toString(),
        weight: v.weight && !isNaN(Number(v.weight)) ? Number(v.weight).toString() : '',
        weightUnit: v.weightUnit,
        dimensions: {
          length: Number(v.dimensions.length) || 0,
          width: Number(v.dimensions.width) || 0,
          height: Number(v.dimensions.height) || 0,
          unit: v.dimensions.unit || 'cm',
        },
        isDefault: v.isDefault,
        existingImages: v.existingImages,
      };
    });
    formData.append('variants', JSON.stringify(variantsPayload));
  
    validVariants.forEach((v) => {
      v.imageFiles.forEach((file, index) => {
        formData.append(`variantImages_${v.sku}_${index}`, file);
      });
    });
  
    const specificationsPayload = specSections
      .filter((s) => s.fields.some((f) => f.label.trim() && f.value.trim()))
      .map((s) => ({
        groupName: s.name,
        fields: s.fields
          .filter((f) => f.label.trim() && f.value.trim())
          .map((f) => ({ fieldName: f.label, fieldValue: f.value })),
      }));
    formData.append('specifications', JSON.stringify(specificationsPayload));
  
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? value.name : value);
    }
  
    try {
      const res = await fetch(`/api/products/edit/${id}`, {
        method: 'PUT',
        body: formData,
      });
  
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || JSON.stringify(error));
      }
  
      toast.success('Product updated successfully!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading product data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-md">
        {error}
        <button
          className="ml-4 text-primary underline"
          onClick={() => router.refresh()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!categoryPresets) {
    return <div className="p-4">No categories available</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-sm text-muted-foreground">Update product details and variants</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Global Fields */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="shortName" className="block text-sm font-medium text-gray-700">
                Short Name
              </label>
              <Input
                id="shortName"
                value={product.shortName}
                onChange={(e) => setProduct({ ...product, shortName: e.target.value })}
                placeholder="e.g. ProBook 450"
                required
              />
            </div>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <Input
                id="fullName"
                value={product.fullName}
                onChange={(e) => setProduct({ ...product, fullName: e.target.value })}
                placeholder="e.g. HP ProBook 450 G8 Laptop"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onClick={() => toggleDropdown('category')}
                >
                  <span>
                    {(product.category && categoryPresets[product.category]?.category.name) || 'Select Category'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === 'category' && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                    {Object.keys(categoryPresets).map((catSlug) => (
                      <div
                        key={catSlug}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setProduct({ ...product, category: catSlug, subcategory: '' });
                          setOpenDropdown(null);
                        }}
                      >
                        {categoryPresets[catSlug].category.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                Subcategory
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onClick={() => toggleDropdown('subcategory')}
                >
                  <span>{product.subcategory || 'Select Subcategory'}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === 'subcategory' && product.category && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                    {categoryPresets[product.category]?.subcategories.map((subcat) => (
                      <div
                        key={subcat.slug}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setProduct({ ...product, subcategory: subcat.name });
                          setOpenDropdown(null);
                        }}
                      >
                        {subcat.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative dropdown-container flex-1">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onClick={() => toggleDropdown('brand')}
                  >
                    <span>
                      {product.brand
                        ? brands.find((b) => b.name === product.brand)?.name || 'Select Brand'
                        : 'Select Brand'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                  {openDropdown === 'brand' && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                      {brands
                        .filter((brand) => brand.isActive)
                        .map((brand) => (
                          <div
                            key={brand.id}
                            className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setProduct({ ...product, brand: brand.name });
                              setOpenDropdown(null);
                            }}
                          >
                            {brand.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/brands/add')}
                  className="flex items-center"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add New
                </Button>
              </div>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onClick={() => toggleDropdown('status')}
                >
                  <span>{statusOptions.find((opt) => opt.value === product.status)?.label || 'Select Status'}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === 'status' && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                    {statusOptions.map((option) => (
                      <div
                        key={option.value}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setProduct({ ...product, status: option.value });
                          setOpenDropdown(null);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="deliveryMode" className="block text-sm font-medium text-gray-700">
                Delivery Mode
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onClick={() => toggleDropdown('deliveryMode')}
                >
                  <span>
                    {deliveryModeOptions.find((opt) => opt.value === product.deliveryMode)?.label ||
                      'Select Delivery Mode'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === 'deliveryMode' && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                    {deliveryModeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setProduct({ ...product, deliveryMode: option.value });
                          setOpenDropdown(null);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <Input
                id="tags"
                value={product.tags}
                onChange={(e) => setProduct({ ...product, tags: e.target.value })}
                placeholder="e.g. gaming, portable, lightweight"
              />
            </div>
            <div>
              <label htmlFor="warranty" className="block text-sm font-medium text-gray-700">
                Warranty
              </label>
              <Input
                id="warranty"
                value={product.warranty}
                onChange={(e) => setProduct({ ...product, warranty: e.target.value })}
                placeholder="e.g. 1 Year"
              />
            </div>
            <div>
              <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
                Meta Title
              </label>
              <Input
                id="metaTitle"
                value={product.metaTitle}
                onChange={(e) => setProduct({ ...product, metaTitle: e.target.value })}
                placeholder="e.g. HP ProBook 450 G8 Laptop"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
                Meta Description
              </label>
              <Textarea
                id="metaDescription"
                value={product.metaDescription}
                onChange={(e) => setProduct({ ...product, metaDescription: e.target.value })}
                placeholder="e.g. Buy HP ProBook 450 G8 with Intel i7, 16GB RAM"
                rows={4}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                id="description"
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                placeholder="Detailed product description"
                rows={6}
              />
            </div>
          </div>

          {/* Variants Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Variants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="mr-1 h-4 w-4" /> Add Variant
              </Button>
            </div>

            {variants.map((variant, variantIndex) => {
              const presetAttributes = (product.category && categoryPresets?.[product.category]?.attributes) || [];
              if (!variantImageInputRefs.current[variant.id]) {
                variantImageInputRefs.current[variant.id] = {
                  main: React.createRef<HTMLInputElement>(),
                  additional: Array(5).fill(null).map(() => null),
                };
              }
              return (
                <div key={variant.id} className="mb-8 rounded-md border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium">Variant {variantIndex + 1}</h3>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Variant Images */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-6 mb-6">
                    <div className="md:col-span-2">
                      <div className="flex flex-col items-center">
                        <div
                          className="relative h-[300px] w-full overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                          onDrop={(e) => handleImageDrop(variant.id, 0, e)}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          {previewUrls[variant.id]?.[0] ? (
                            <div className="relative h-full w-full">
                              <Image
                                src={previewUrls[variant.id][0]}
                                alt={`Main image for variant ${variantIndex + 1}`}
                                fill
                                className="object-contain p-2"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(variant.id, 0)}
                                className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
                              onClick={() => variantImageInputRefs.current[variant.id]?.main.current?.click()}
                            >
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                                <Plus className="h-6 w-6" />
                              </div>
                              <p className="mt-2 text-sm font-medium text-primary">Upload Main Image</p>
                              <p className="text-xs text-gray-500">or drop a file</p>
                            </div>
                          )}
                          <input
                            ref={variantImageInputRefs.current[variant.id]?.main}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(variant.id, 0, e)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div
                            key={index}
                            className="relative h-[140px] w-full overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                            onDrop={(e) => handleImageDrop(variant.id, index + 1, e)}
                            onDragOver={(e) => e.preventDefault()}
                          >
                            {previewUrls[variant.id]?.[index + 1] ? (
                              <div className="relative h-full w-full">
                                <Image
                                  src={previewUrls[variant.id][index + 1]}
                                  alt={`Additional image ${index + 1}`}
                                  fill
                                  className="object-contain p-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(variant.id, index + 1)}
                                  className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
                                onClick={() => variantImageInputRefs.current[variant.id]?.additional[index]?.click()}
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary">
                                  <Plus className="h-4 w-4" />
                                </div>
                                <p className="mt-1 text-xs font-medium text-primary">Upload Image</p>
                                <p className="text-[10px] text-gray-500">or drop a file</p>
                              </div>
                            )}
                            <input
                              ref={(el) => {
                                if (variantImageInputRefs.current[variant.id]) {
                                  variantImageInputRefs.current[variant.id].additional[index] = el;
                                }
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(variant.id, index + 1, e)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Variant Fields */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor={`name-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        Variant Name
                      </label>
                      <Input
                        id={`name-${variant.id}`}
                        value={variant.name}
                        onChange={(e) => handleVariantChange(variant.id, 'name', e.target.value)}
                        placeholder="e.g. ProBook 450 G8 i7"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`sku-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        SKU
                      </label>
                      <Input
                        id={`sku-${variant.id}`}
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(variant.id, 'sku', e.target.value)}
                        placeholder="e.g. PB450-I7-256"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`mrp-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        MRP
                      </label>
                      <Input
                        id={`mrp-${variant.id}`}
                        value={variant.mrp}
                        onChange={(e) => handleVariantChange(variant.id, 'mrp', e.target.value)}
                        type="number"
                        step="0.01"
                        placeholder="e.g. 999.99"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`ourPrice-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        Our Price
                      </label>
                      <Input
                        id={`ourPrice-${variant.id}`}
                        value={variant.ourPrice}
                        onChange={(e) => handleVariantChange(variant.id, 'ourPrice', e.target.value)}
                        type="number"
                        step="0.01"
                        placeholder="e.g. 899.99"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`salePrice-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        Sale Price
                      </label>
                      <Input
                        id={`salePrice-${variant.id}`}
                        value={variant.salePrice}
                        onChange={(e) => handleVariantChange(variant.id, 'salePrice', e.target.value)}
                        type="number"
                        step="0.01"
                        placeholder="e.g. 799.99"
                      />
                    </div>
                    <div>
                      <label htmlFor={`stock-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        Stock
                      </label>
                      <Input
                        id={`stock-${variant.id}`}
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(variant.id, 'stock', e.target.value)}
                        type="number"
                        min="0"
                        placeholder="e.g. 50"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`lowStockThreshold-${variant.id}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Low Stock Threshold
                      </label>
                      <Input
                        id={`lowStockThreshold-${variant.id}`}
                        value={variant.lowStockThreshold}
                        onChange={(e) => handleVariantChange(variant.id, 'lowStockThreshold', e.target.value)}
                        type="number"
                        min="0"
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div>
                      <label htmlFor={`weight-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        Weight
                      </label>
                      <Input
                        id={`weight-${variant.id}`}
                        value={variant.weight}
                        onChange={(e) => handleVariantChange(variant.id, 'weight', e.target.value)}
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2.5"
                      />
                    </div>
                    <div>
                      <label htmlFor={`weightUnit-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        Weight Unit
                      </label>
                      <div className="relative dropdown-container">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                          onClick={() => toggleDropdown(`weightUnit-${variant.id}`)}
                        >
                          <span>{variant.weightUnit || 'Select Unit'}</span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </button>
                        {openDropdown === `weightUnit-${variant.id}` && (
                          <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                            {['kg', 'g', 'lb', 'oz'].map((unit) => (
                              <div
                                key={unit}
                                className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                                onClick={() => {
                                  handleVariantChange(variant.id, 'weightUnit', unit);
                                  setOpenDropdown(null);
                                }}
                              >
                                {unit}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Length"
                          type="number"
                          value={variant.dimensions.length}
                          onChange={(e) =>
                            handleVariantChange(variant.id, 'dimensions', {
                              ...variant.dimensions,
                              length: Number(e.target.value),
                            })
                          }
                        />
                        <Input
                          placeholder="Width"
                          type="number"
                          value={variant.dimensions.width}
                          onChange={(e) =>
                            handleVariantChange(variant.id, 'dimensions', {
                              ...variant.dimensions,
                              width: Number(e.target.value),
                            })
                          }
                        />
                        <Input
                          placeholder="Height"
                          type="number"
                          value={variant.dimensions.height}
                          onChange={(e) =>
                            handleVariantChange(variant.id, 'dimensions', {
                              ...variant.dimensions,
                              height: Number(e.target.value),
                            })
                          }
                        />
                        <div className="relative dropdown-container">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            onClick={() => toggleDropdown(`dimensionUnit-${variant.id}`)}
                          >
                            <span>{variant.dimensions.unit || 'cm'}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </button>
                          {openDropdown === `dimensionUnit-${variant.id}` && (
                            <div className=" Strip long lines for better readability
                            absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                              {['cm', 'in', 'mm'].map((unit) => (
                                <div
                                  key={unit}
                                  className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                                  onClick={() => {
                                    handleVariantChange(variant.id, 'dimensions', {
                                      ...variant.dimensions,
                                      unit,
                                    });
                                    setOpenDropdown(null);
                                  }}
                                >
                                  {unit}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variant Attributes */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium">Attributes</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomAttribute(variant.id)}
                      >
                        <Plus className="mr-1 h-4 w-4" /> Add Custom Attribute
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {presetAttributes.map((attr) => (
                        <div key={attr.name}>
                          <label className="block text-sm font-medium text-gray-700">
                            {attr.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            {attr.isRequired && <span className="text-red-500">*</span>}
                          </label>
                          {attr.type === 'select' && attr.options ? (
                            <div className="relative dropdown-container">
                              <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onClick={() => toggleDropdown(`attr-${variant.id}-${attr.name}`)}
                              >
                                <span>{variant.attributes[attr.name] || `Select ${attr.name}`}</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </button>
                              {openDropdown === `attr-${variant.id}-${attr.name}` && (
                                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                                  {attr.options.map((option) => (
                                    <div
                                      key={option}
                                      className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                                      onClick={() => {
                                        handleAttributeChange(variant.id, attr.name, option);
                                        setOpenDropdown(null);
                                      }}
                                    >
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : attr.type === 'boolean' ? (
                            <div className="relative dropdown-container">
                              <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onClick={() => toggleDropdown(`attr-${variant.id}-${attr.name}`)}
                              >
                                <span>
                                  {variant.attributes[attr.name] === true
                                    ? 'True'
                                    : variant.attributes[attr.name] === false
                                      ? 'False'
                                      : `Select ${attr.name}`}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </button>
                              {openDropdown === `attr-${variant.id}-${attr.name}` && (
                                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                                  {['True', 'False'].map((option) => (
                                    <div
                                      key={option}
                                      className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                                      onClick={() => {
                                        handleAttributeChange(variant.id, attr.name, option === 'True');
                                        setOpenDropdown(null);
                                      }}
                                    >
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Input
                              value={variant.attributes[attr.name]?.toString() || ''}
                              onChange={(e) => {
                                const value =
                                  attr.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                                handleAttributeChange(variant.id, attr.name, value);
                              }}
                              placeholder={`Enter ${attr.name}`}
                              type={attr.type === 'number' ? 'number' : 'text'}
                              required={attr.isRequired}
                            />
                          )}
                          {attr.unit && <p className="text-xs text-gray-500 mt-1">Unit: {attr.unit}</p>}
                        </div>
                      ))}
                      {customAttributes[variant.id]?.map((attr, index) => (
                        <div key={index} className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Custom Attribute Name</label>
                            <Input
                              value={attr.name}
                              onChange={(e) => updateCustomAttribute(variant.id, index, 'name', e.target.value)}
                              placeholder="Attribute Name"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Value</label>
                            <Input
                              value={attr.value}
                              onChange={(e) => updateCustomAttribute(variant.id, index, 'value', e.target.value)}
                              placeholder="Attribute Value"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomAttribute(variant.id, index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Specifications */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Product Specifications</h2>
              <Button type="button" variant="outline" size="sm" onClick={addNewSection}>
                <Plus className="mr-1 h-4 w-4" /> New Section
              </Button>
            </div>
            <div className="space-y-6">
              {specSections.map((section, index) => (
                <DraggableSpecSection
                  key={section.id}
                  section={section}
                  index={index}
                  moveSection={moveSection}
                  handleSpecFieldChange={handleSpecFieldChange}
                  addFieldToSection={addFieldToSection}
                  updateSectionName={updateSectionName}
                  removeSection={removeSection}
                  removeFieldFromSection={removeFieldFromSection}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Button type="submit" className="w-[40%] rounded-full bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover">
              Update Product
            </Button>
          </div>
        </form>
      </div>
    </DndProvider>
  );
}