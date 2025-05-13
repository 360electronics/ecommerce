"use client";
import React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubProductSelector } from "@/components/Admin/Product/SubProductSelector";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { slugify } from "@/utils/slugify";

// Status options
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Product categories
const categories = ['Laptops', 'Monitors', 'Processor', 'Graphics Card', 'Accessories', 'Storage', 'Cabinets'];

// Interface for specification field
interface SpecField {
  id: string;
  label: string;
  value: string;
}

// Interface for specification section
interface SpecSection {
  id: string;
  name: string;
  fields: SpecField[];
  isRequired?: boolean;
  isFixed?: boolean;
}

// Interface for variant
interface Variant {
  id: string;
  name: string;
  sku: string;
  color: string;
  material: string;
  dimensions: string;
  weight: string;
  mrp: string;
  storage: string;
  ourPrice: string;
  stock: string;
  productImages: (string | null)[];
}

// Type for drag item
interface DragItem {
  index: number;
  id: string;
  type: string;
}

// DraggableSpecSection component (unchanged)
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
  handleSpecFieldChange: (sectionId: string, fieldId: string, type: "label" | "value", value: string) => void;
  addFieldToSection: (sectionId: string) => void;
  updateSectionName: (sectionId: string, name: string) => void;
  removeSection: (sectionId: string) => void;
  removeFieldFromSection: (sectionId: string, fieldId: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const canDrag = !section.isFixed;

  const [{ isDragging }, drag] = useDrag({
    type: "SPEC_SECTION",
    item: () => ({ index, id: section.id, type: "SPEC_SECTION" }),
    canDrag: canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }] = useDrop({
    accept: "SPEC_SECTION",
    canDrop: (item: DragItem) => {
      if (section.isFixed) return false;
      if (item.id === "general") return false;
      return true;
    },
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex || section.isFixed) return;
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

  const attachRef = (el: HTMLDivElement | null) => {
    ref.current = el;
    // const dropRef = drop(el);
    if (canDrag) {
      drag(el);
    }
  };

  const borderStyle = isOver && canDrop ? "border-blue-400" : isOver && !canDrop ? "border-red-400" : "border-gray-200";

  return (
    <div
      ref={attachRef}
      className={`rounded-md border p-4 transition-colors ${borderStyle} ${isDragging ? "opacity-50" : "opacity-100"}`}
      style={{ cursor: canDrag ? "move" : "default" }}
    >
      <div className="mb-4 flex items-center justify-between">
        {section.id === "general" ? (
          <div className="flex items-center">
            <h3 className="font-medium">
              General <span className="text-xs text-red-500">(Required)</span>
            </h3>
          </div>
        ) : section.id === "warranty" ? (
          <div className="flex items-center">
            <h3 className="font-medium">Warranty</h3>
          </div>
        ) : (
          <div className="flex items-center space-x-2 w-full">
            <div className="cursor-move">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={section.name}
              onChange={(e) => updateSectionName(section.id, e.target.value)}
              placeholder="Row Name"
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
            <div className="relative">
              <Input
                placeholder={`label name (e.g. ${section.name === "General" ? "Model name, Brand" : section.name === "Warranty" ? "Warranty Summary" : "Processor"} )`}
                value={field.label}
                onChange={(e) => handleSpecFieldChange(section.id, field.id, "label", e.target.value)}
              />
            </div>
            <div className="relative flex items-center">
              <Input
                placeholder={`value name (e.g. ${section.name === "General" ? "HP ProBook, HP" : section.name === "Warranty" ? "1 Year" : "Intel i7"} )`}
                value={field.value}
                onChange={(e) => handleSpecFieldChange(section.id, field.id, "value", e.target.value)}
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

export default function AddProductPage() {
  const router = useRouter();

  // Global product state
  const [product, setProduct] = useState({
    shortName: "",
    category: "",
    brand: "",
    description: "",
    status: "active",
    subProductStatus: "active",
    deliveryMode: "standard",
    tags: "",
  });

  // Variants state
  const [variants, setVariants] = useState<Variant[]>([
    {
      id: `variant-${Date.now()}`,
      name: "",
      sku: "",
      color: "",
      material: "",
      dimensions: "",
      weight: "",
      mrp: "",
      ourPrice: "",
      storage: "", // Initialize storage
      stock: "",
      productImages: Array(6).fill(null),
    },
  ]);

  // Specification sections state
  const [specSections, setSpecSections] = useState<SpecSection[]>([
    {
      id: "general",
      name: "General",
      fields: [
        { id: "field1", label: "Brand", value: "" },
        { id: "field2", label: "Material", value: "" },
        { id: "field3", label: "Color", value: "" },
      ],
      isRequired: true,
      isFixed: true,
    },
    {
      id: "physical",
      name: "Dimensions",
      fields: [
        { id: "field1", label: "Dimensions", value: "" },
        { id: "field2", label: "Weight", value: "" },
      ],
      isFixed: false,
    },
  ]);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Refs for image inputs (one set per variant)
  const variantImageInputRefs = useRef<{
    [variantId: string]: { main: React.RefObject<HTMLInputElement | null>; additional: (HTMLInputElement | null)[] };
  }>({});

  // Initialize refs for initial variants
  variants.forEach((variant) => {
    if (!variantImageInputRefs.current[variant.id]) {
      variantImageInputRefs.current[variant.id] = {
        main: React.createRef<HTMLInputElement | null>(),
        additional: Array(5).fill(null),
      };
    }
  });

  // Update refs when variants change
  useEffect(() => {
    variants.forEach((variant) => {
      if (!variantImageInputRefs.current[variant.id]) {
        variantImageInputRefs.current[variant.id] = {
          main: React.createRef<HTMLInputElement | null>(),
          additional: Array(5).fill(null),
        };
      }
    });

    // Cleanup refs for removed variants
    const variantIds = new Set(variants.map((v) => v.id));
    Object.keys(variantImageInputRefs.current).forEach((id) => {
      if (!variantIds.has(id)) {
        delete variantImageInputRefs.current[id];
      }
    });
  }, [variants]);

  // Handle variant field changes
  const handleVariantChange = (id: string, field: keyof Variant, value: string) => {
    setVariants((prev) =>
      prev.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant))
    );
  };

  // Add variant
  const addVariant = () => {
    const newVariant = {
      id: `variant-${Date.now()}`,
      name: "",
      sku: "",
      color: "",
      material: "",
      dimensions: "",
      weight: "",
      mrp: "",
      ourPrice: "",
      storage: "", // Initialize storage
      stock: "",
      productImages: Array(6).fill(null),
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  // Remove variant
  const removeVariant = (id: string) => {
    if (variants.length === 1) return; // Prevent removing the last variant
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
    // Deletion moved to useEffect cleanup
  };

  // Sync product fields with specSections
  useEffect(() => {
    setSpecSections((prev) =>
      prev.map((section) => {
        if (section.id === "general") {
          const updatedFields = section.fields.map((field) => {
            if (field.label.toLowerCase() === "brand") return { ...field, value: product.brand };
            return field;
          });
          return { ...section, fields: updatedFields };
        }
        return section;
      })
    );
  }, [product.brand]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Handle dropdown toggle
  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // Convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload for variants
  const handleImageUpload = async (variantId: string, index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setVariants((prev) =>
        prev.map((variant) =>
          variant.id === variantId
            ? {
              ...variant,
              productImages: variant.productImages.map((img, i) => (i === index ? base64 : img)),
            }
            : variant
        )
      );
    }
  };

  // Handle drag and drop for images
  const handleImageDrop = async (variantId: string, index: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const base64 = await fileToBase64(file);
      setVariants((prev) =>
        prev.map((variant) =>
          variant.id === variantId
            ? {
              ...variant,
              productImages: variant.productImages.map((img, i) => (i === index ? base64 : img)),
            }
            : variant
        )
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle specification field changes
  const handleSpecFieldChange = (sectionId: string, fieldId: string, type: "label" | "value", value: string) => {
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
              { id: `field${section.fields.length + 1}-${Date.now()}`, label: "", value: "" },
            ],
          }
          : section
      )
    );
  };

  const removeFieldFromSection = (sectionId: string, fieldId: string) => {
    setSpecSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId && section.fields.length > 1) {
          return {
            ...section,
            fields: section.fields.filter((field) => field.id !== fieldId),
          };
        }
        return section;
      })
    );
  };

  const updateSectionName = (sectionId: string, name: string) => {
    setSpecSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, name } : section))
    );
  };

  const removeSection = (sectionId: string) => {
    if (sectionId === "general" || sectionId === "warranty") return;
    setSpecSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const addNewSection = () => {
    const newSectionId = `section${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const warrantyIndex = specSections.findIndex((section) => section.id === "warranty");
    const newSections = [...specSections];
    const insertIndex = warrantyIndex !== -1 ? warrantyIndex : specSections.length;
    newSections.splice(insertIndex, 0, {
      id: newSectionId,
      name: "New Row",
      fields: [{ id: "field1", label: "", value: "" }],
      isFixed: false,
    });
    setSpecSections(newSections);
  };

  const moveSection = (dragIndex: number, hoverIndex: number) => {
    const dragSection = specSections[dragIndex];
    if (dragSection.id === "general" || dragSection.id === "warranty" || hoverIndex === 0) return;
    if (hoverIndex === specSections.length - 1 && specSections[specSections.length - 1].id === "warranty") return;
    setSpecSections((prevSections) => {
      const newSections = [...prevSections];
      newSections.splice(dragIndex, 1);
      newSections.splice(hoverIndex, 0, dragSection);
      return newSections;
    });
  };

  const parseColors = (colorString: string): string[] => {
    if (!colorString) return [];
    return colorString.split(",").map((c) => c.trim()).filter(Boolean);
  };

  const isValidColor = (color: string): boolean => {
    const s = new Option().style;
    s.backgroundColor = color;
    return s.backgroundColor !== "";
  };

  const parseTagsToArray = (tagString: string): string[] => {
    if (!tagString) return [];
    return tagString.split(",").map((tag) => tag.trim()).filter(Boolean);
  };

  const addTagsToFormData = (formData: FormData, tagString: string) => {
    const tags = parseTagsToArray(tagString);
    if (tags.length > 0) {
      formData.append("tags", tagString); // Keep as comma-separated string to match schema
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Global validations
    if (!product.shortName) return alert("Product short name is required");
    if (!product.category) return alert("Category is required");
    if (!product.brand) return alert("Brand is required");

    // Variant validations
    const validVariants = variants.filter(
      (v) =>
        v.name.trim() &&
        v.sku.trim() &&
        v.color.trim() &&
        parseColors(v.color).some((c) => isValidColor(c)) &&
        v.mrp.trim() &&
        Number(v.mrp) > 0 &&
        v.ourPrice.trim() &&
        Number(v.ourPrice) > 0 &&
        v.stock.trim() &&
        (product.category !== 'Laptops' || v.storage.trim()) &&
        Number(v.stock) >= 0 &&
        v.productImages[0]
    );
    if (validVariants.length === 0) {
      return alert("At least one valid variant with all required fields and main image is required");
    }

    const generalSection = specSections.find((section) => section.id === "general");
    if (
      !generalSection ||
      !generalSection.fields.some((field) => field.label.trim() && field.value.trim())
    ) {
      return alert("At least one field in the General section is required");
    }

    // Generate slug from shortName
  

    // Prepare FormData
    const formData = new FormData();
    formData.append("shortName", product.shortName);
    formData.append("category", product.category);
    formData.append("brand", product.brand);
    formData.append("description", product.description || "");
    formData.append("status", product.status);
    formData.append("subProductStatus", product.subProductStatus);
    formData.append("deliveryMode", product.deliveryMode);
    addTagsToFormData(formData, product.tags || "");

    // Calculate total stocks from variants
    const totalStocks = validVariants.reduce((sum, v) => sum + Number(v.stock), 0);
    formData.append("totalStocks", totalStocks.toString());

    // Add variants to FormData
    const variantsPayload = validVariants.map((v) => ({

      

      name: v.name,
      slug: slugify(v.name),
      sku: v.sku,
      color: v.color,
      material: v.material || "",
      dimensions: v.dimensions || "",
      weight: v.weight || "",
      mrp: v.mrp,
      ourPrice: v.ourPrice,
      stock: v.stock,
      storage: v.storage || "", // Include storag
      productImages: v.productImages.filter((img): img is string => img !== null),
    }));
    formData.append("variants", JSON.stringify(variantsPayload));

    // Add images to FormData
    for (const variant of validVariants) {
      let mainImageAdded = false;
      if (typeof variant.productImages[0] === "string" && variant.productImages[0].startsWith("data:")) {
        try {
          const response = await fetch(variant.productImages[0]);
          const blob = await response.blob();
          formData.append(
            `variant-${variant.id}-images`,
            blob,
            `main-image-${variant.id}-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`
          );
          mainImageAdded = true;
        } catch (error) {
          console.error(`Error converting main image for variant ${variant.id}:`, error);
        }
      }
      if (!mainImageAdded) {
        return alert(`Main product image for variant ${variant.name} could not be processed`);
      }

      for (let i = 1; i < variant.productImages.length; i++) {
        const image = variant.productImages[i];
        if (typeof image === "string" && image.startsWith("data:")) {
          try {
            const response = await fetch(image);
            const blob = await response.blob();
            formData.append(
              `variant-${variant.id}-images`,
              blob,
              `additional-image-${variant.id}-${Date.now()}-${i}.${blob.type.split("/")[1] || "jpg"}`
            );
          } catch (error) {
            console.error(`Error converting additional image ${i} for variant ${variant.id}:`, error);
          }
        }
      }
    }

    // Prepare specifications payload
    const specificationsPayload = specSections
      .filter((section) => section.fields.some((f) => f.label.trim() && f.value.trim()))
      .map((section) => ({
        groupName: section.name,
        fields: section.fields
          .filter((f) => f.label.trim() && f.value.trim())
          .map((f) => ({
            fieldName: f.label,
            fieldValue: f.value,
          })),
      }));
    formData.append("specifications", JSON.stringify(specificationsPayload));

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      const responseText = await res.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { message: responseText };
      }

      if (!res.ok) {
        throw new Error(result.message || "Failed to create product");
      }

      alert("Product added successfully!");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error submitting product:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
            <p className="text-sm text-muted-foreground">Create a new product with variants in your inventory</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Global Fields */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="short-name" className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <Input
                id="short-name"
                value={product.shortName}
                onChange={(e) => setProduct((prev) => ({ ...prev, shortName: e.target.value }))}
                placeholder="e.g. ProBook 450"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="relative mt-1 dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggleDropdown("category")}
                >
                  <span>{product.category || "Select the Category"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "category" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1">
                      {categories.map((cat) => (
                        <div
                          key={cat}
                          className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setProduct((prev) => ({ ...prev, category: cat }));
                            setOpenDropdown(null);
                          }}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <Input
                id="brand"
                value={product.brand}
                onChange={(e) => setProduct((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder="e.g. HP, Dell"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="relative mt-1 dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggleDropdown("status")}
                >
                  <span>{statusOptions.find((opt) => opt.value === product.status)?.label || "Select Status"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "status" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1">
                      {statusOptions.map((option) => (
                        <div
                          key={option.value}
                          className="cursor-pointer capitalize px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setProduct((prev) => ({ ...prev, status: option.value }));
                            setOpenDropdown(null);
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="sub-status" className="block text-sm font-medium text-gray-700">
                Sub Product Status
              </label>
              <div className="relative mt-1 dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggleDropdown("subStatus")}
                >
                  <span>{product.subProductStatus === "active" ? "Active" : "Inactive"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "subStatus" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1">
                      {statusOptions.map((option) => (
                        <div
                          key={option.value}
                          className="cursor-pointer capitalize px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setProduct((prev) => ({ ...prev, subProductStatus: option.value }));
                            setOpenDropdown(null);
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="delivery-mode" className="block text-sm font-medium text-gray-700">
                Delivery Mode
              </label>
              <div className="relative mt-1 dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggleDropdown("deliveryMode")}
                >
                  <span>{product.deliveryMode === "standard" ? "Standard" : "Express"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "deliveryMode" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1">
                      {["standard", "express"].map((option) => (
                        <div
                          key={option}
                          className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setProduct((prev) => ({ ...prev, deliveryMode: option }));
                            setOpenDropdown(null);
                          }}
                        >
                          {option === "standard" ? "Standard" : "Express"}
                        </div>
                      ))}
                    </div>
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
                value={product.tags || ""}
                onChange={(e) => setProduct((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g. gaming, portable, lightweight"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="short-description" className="block text-sm font-medium text-gray-700">
                Short Description
              </label>
              <textarea
                id="short-description"
                value={product.description || ""}
                onChange={(e) => setProduct((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the product"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={4}
              />
            </div>
          </div>

          {/* Variants Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Variants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="flex items-center">
                <Plus className="mr-1 h-4 w-4" />
                Add Variant
              </Button>
            </div>

            {variants.map((variant, variantIndex) => (
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
                        onDragOver={handleDragOver}
                      >
                        {variant.productImages[0] ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={variant.productImages[0]}
                              alt={`Main image for variant ${variantIndex + 1}`}
                              fill
                              className="object-contain p-2"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setVariants((prev) =>
                                  prev.map((v) =>
                                    v.id === variant.id
                                      ? {
                                        ...v,
                                        productImages: v.productImages.map((img, i) => (i === 0 ? null : img)),
                                      }
                                      : v
                                  )
                                )
                              }
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
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <Plus className="h-6 w-6" />
                            </div>
                            <p className="mt-2 text-sm font-medium text-blue-600">Upload Image</p>
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
                      {variant.productImages.slice(1).map((image, index) => (
                        <div
                          key={index}
                          className="relative h-[140px] w-full overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                          onDrop={(e) => handleImageDrop(variant.id, index + 1, e)}
                          onDragOver={handleDragOver}
                        >
                          {image ? (
                            <div className="relative h-full w-full">
                              <Image
                                src={image}
                                alt={`Additional image ${index + 1} for variant ${variantIndex + 1}`}
                                fill
                                className="object-contain p-2"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setVariants((prev) =>
                                    prev.map((v) =>
                                      v.id === variant.id
                                        ? {
                                          ...v,
                                          productImages: v.productImages.map((img, i) =>
                                            i === index + 1 ? null : img
                                          ),
                                        }
                                        : v
                                    )
                                  )
                                }
                                className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
                              onClick={() =>
                                variantImageInputRefs.current[variant.id]?.additional[index]?.click()
                              }
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <Plus className="h-4 w-4" />
                              </div>
                              <p className="mt-1 text-xs font-medium text-blue-600">Upload Image</p>
                              <p className="text-[10px] text-gray-500">or drop a file</p>
                            </div>
                          )}
                          <input
                            ref={(el) => {
                              const variantRefs = variantImageInputRefs.current[variant.id];
                              if (variantRefs && el !== null) {
                                variantRefs.additional[index] = el;
                              } else if (variantRefs && el === null) {
                                variantRefs.additional[index] = null;
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
                    <label htmlFor={`variant-name-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      Variant Name
                    </label>
                    <Input
                      id={`variant-name-${variant.id}`}
                      value={variant.name}
                      onChange={(e) => handleVariantChange(variant.id, "name", e.target.value)}
                      placeholder="e.g. ProBook 450 G8"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`sku-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      Stock Keeping Unit (SKU)
                    </label>
                    <Input
                      id={`sku-${variant.id}`}
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(variant.id, "sku", e.target.value)}
                      placeholder="e.g. PB450-256-BLUE"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`colors-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      Colors
                    </label>
                    <div className="relative mt-1 flex items-center">
                      <Input
                        id={`colors-${variant.id}`}
                        value={variant.color}
                        onChange={(e) => handleVariantChange(variant.id, "color", e.target.value)}
                        placeholder="e.g. Red, Blue, #000000"
                        className="pr-16"
                        required
                      />
                      <div className="absolute right-2 flex items-center space-x-1">
                        {parseColors(variant.color).map((c, index) => (
                          isValidColor(c) && (
                            <div
                              key={index}
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          )
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`material-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      Material
                    </label>
                    <Input
                      id={`material-${variant.id}`}
                      value={variant.material || ""}
                      onChange={(e) => handleVariantChange(variant.id, "material", e.target.value)}
                      placeholder="e.g. Aluminum, Plastic"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor={`dimensions-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      Dimensions
                    </label>
                    <Input
                      id={`dimensions-${variant.id}`}
                      value={variant.dimensions || ""}
                      onChange={(e) => handleVariantChange(variant.id, "dimensions", e.target.value)}
                      placeholder="e.g. 15 x 10 x 1 inches"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor={`weight-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      Weight
                    </label>
                    <Input
                      id={`weight-${variant.id}`}
                      value={variant.weight || ""}
                      onChange={(e) => handleVariantChange(variant.id, "weight", e.target.value)}
                      placeholder="e.g. 2.5 lbs"
                      className="mt-1"
                    />
                  </div>

                  {product.category === 'Laptops' && (
                    <div>
                      <label htmlFor={`storage-${variant.id}`} className="block text-sm font-medium text-gray-700">
                        Storage
                      </label>
                      <Input
                        id={`storage-${variant.id}`}
                        value={variant.storage}
                        onChange={(e) => handleVariantChange(variant.id, "storage", e.target.value)}
                        placeholder="e.g. 256GB SSD"
                        className="mt-1"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor={`mrp-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      MRP
                    </label>
                    <Input
                      id={`mrp-${variant.id}`}
                      value={variant.mrp}
                      onChange={(e) => handleVariantChange(variant.id, "mrp", e.target.value)}
                      placeholder="e.g. ₹2000"
                      type="number"
                      step="0.01"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`our-price-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      Our Price
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                      <Input
                        id={`our-price-${variant.id}`}
                        value={variant.ourPrice}
                        onChange={(e) => handleVariantChange(variant.id, "ourPrice", e.target.value)}
                        placeholder="20000"
                        type="number"
                        step="0.01"
                        className="pl-8 mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`stock-${variant.id}`} className="block text-sm font-medium text-gray-700">
                      Stock
                    </label>
                    <Input
                      id={`stock-${variant.id}`}
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(variant.id, "stock", e.target.value)}
                      placeholder="e.g. 50"
                      type="number"
                      min="0"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Specifications */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Product Specifications</h2>
              <Button type="button" variant="outline" size="sm" onClick={addNewSection} className="flex items-center">
                <Plus className="mr-1 h-4 w-4" />
                New Row
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

          {/* Sub Products */}
          {product.subProductStatus === "active" && (
            <div>
              <h2 className="mb-4 text-lg font-medium">Sub Products</h2>
              <SubProductSelector />
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              className="mt-14 my-5 w-[40%] cursor-pointer rounded-full bg-blue-600 px-8 py-2 text-white hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </DndProvider>
  );
}