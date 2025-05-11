"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubProductSelector } from "@/components/Admin/Product/SubProductSelector";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Product } from "@/types/product";

// Status options
const statusOptions = ["Active", "Inactive"];

// Product categories
const categories = ['Laptops', 'Monitors', 'Processor', 'Graphics Card', 'Accessories', 'Storage',  'Cabinets'];

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

// Type for drag item
interface DragItem {
  index: number;
  id: string;
  type: string;
}

// Initial empty product state
const initialProductState = {
  name: "",
  slug: "",
  category: "",
  brand: "",
  color: "",
  mrp: "",
  ourPrice: "",
  storage: "",
  status: "Active",
  subProductStatus: "Active",
  totalStocks: "",
  deliveryMode: "Standard",
  weight: "",
  dimensions: "",
  material: "",
  tags: "",
  shortDescription: "",
  productImages: Array(6).fill(null),
  sku: "",
};

// Initial spec sections state
const initialSpecSections = [
  {
    id: "general",
    name: "General",
    fields: [
      { id: "field1", label: "Brand", value: "" },
      { id: "field2", label: "Material", value: "" },
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
];

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
      if (item.id === "general" || item.id === "warranty") return false;
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
                placeholder={`label name (e.g. ${section.name === "General" ? "Model name, Brand" : section.name === "Warranty" ? "Warranty Summary" : "Processor"})`}
                value={field.label}
                onChange={(e) => handleSpecFieldChange(section.id, field.id, "label", e.target.value)}
              />
            </div>
            <div className="relative flex items-center">
              <Input
                placeholder={`value name (e.g. ${section.name === "General" ? "HP ProBook, HP" : section.name === "Warranty" ? "1 Year" : "Intel i7"})`}
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

export default function EditProductPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [product, setProduct] = useState({ ...initialProductState });
  const [specSections, setSpecSections] = useState<SpecSection[]>([...initialSpecSections]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Refs
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const additionalImageInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs
  useEffect(() => {
    additionalImageInputRefs.current = Array(5).fill(null)
  }, [])


  const getProductData = async (slug: string): Promise<Product | null> => {
    try {
      const res = await fetch(`/api/products/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to fetch product data:", res.status);
        return null;
      }
      const data: Product = await res.json();
      console.log("Fetched product data:", data); // Debugging
      return data;
    } catch (error) {
      console.error("Error fetching product data:", error);
      return null;
    }
  };

  // Fetch product data on component load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getProductData(slug);

      if (data) {
        setProduct({
          name: data.name || "",
          slug: data.slug || "",
          category: data.category || "",
          brand: data.brand || "",
          color: data.color || "",
          mrp: data.mrp?.toString() || "",
          storage: data.storage?.toString() || "",
          ourPrice: data.ourPrice?.toString() || "",
          status: data.status || "Active",
          subProductStatus: data.subProductStatus || "Active",
          totalStocks: data.totalStocks?.toString() || "",
          deliveryMode: data.deliveryMode || "Standard",
          weight: data.weight || "",
          dimensions: data.dimensions || "",
          material: data.material || "",
          tags: Array.isArray(data.tags)
            ? data.tags.join(", ")
            : typeof data.tags === 'string'
              ? data.tags
              : "",
          shortDescription: data.description || "",
          productImages: [...(data.productImages || []), ...Array(6).fill(null)].slice(0, 6),
          sku: data.sku || "",
        });

        console.log("Fetched tags data:", data.tags);

        // Process specifications into spec sections
        if (data.specifications && Array.isArray(data.specifications)) {
          const newSpecSections = [...initialSpecSections];
          data.specifications.forEach((spec) => {
            if (!spec.groupName) return;
            const existingSectionIndex = newSpecSections.findIndex(
              (section) => section.name.toLowerCase() === spec.groupName.toLowerCase(),
            );
            if (existingSectionIndex >= 0) {
              const fields = spec.fields.map((field: { fieldName: any; fieldValue: any; }, idx: number) => ({
                id: `field${idx + 1}`,
                label: field.fieldName || "",
                value: field.fieldValue || "",
              }));
              newSpecSections[existingSectionIndex].fields = fields;
            } else {
              newSpecSections.push({
                id: `section${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: spec.groupName,
                fields: spec.fields.map((field: { fieldName: any; fieldValue: any; }, idx: number) => ({
                  id: `field${idx + 1}`,
                  label: field.fieldName || "",
                  value: field.fieldValue || "",
                })),
                isFixed: false,
              });
            }
          });
          setSpecSections(newSpecSections);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [slug]);

  // Update product state helper
  const updateProduct = (field: string, value: any) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const fieldMap: { [key: string]: string } = {
      "product-name": "name",
      sku: "sku",
      brand: "brand",
      colors: "color",
      material: "material",
      dimensions: "dimensions",
      weight: "weight",
      mrp: "mrp",
      "our-price": "ourPrice",
      "total-stocks": "totalStocks",
      tags: "tags",
      "short-description": "shortDescription",
    };
    const field = fieldMap[id] || id;
    updateProduct(field, value);
  };

  // Sync brand, color, material, dimensions, and weight with spec sections
  useEffect(() => {
    setSpecSections((prev) =>
      prev.map((section) => {
        if (section.id === "general") {
          let updatedFields = section.fields.map((field) => {
            if (field.label.toLowerCase() === "brand") return { ...field, value: product.brand };
            if (field.label.toLowerCase() === "material") return { ...field, value: product.material };
            if (field.label.toLowerCase() === "color") return { ...field, value: product.color };
            return field;
          });

          // Handle color field
          const hasColorField = updatedFields.some((field) => field.label.toLowerCase() === "color");
          if (product.color && !hasColorField) {
            updatedFields = [
              ...updatedFields,
              { id: `color-field-${Date.now()}`, label: "Color", value: product.color },
            ];
          } else if (!product.color && hasColorField) {
            updatedFields = updatedFields.filter((field) => field.label.toLowerCase() !== "color");
          }

          return { ...section, fields: updatedFields };
        }
        if (section.id === "physical") {
          return {
            ...section,
            fields: section.fields.map((field) => {
              if (field.label.toLowerCase() === "dimensions") return { ...field, value: product.dimensions };
              if (field.label.toLowerCase() === "weight") return { ...field, value: product.weight };
              return field;
            }),
          };
        }
        return section;
      }),
    );
  }, [product.brand, product.color, product.material, product.dimensions, product.weight]);

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

  // Handle main image upload
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const newImages = [...product.productImages];
      newImages[0] = base64;
      updateProduct("productImages", newImages);
    }
  };

  // Handle additional image upload
  const handleAdditionalImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const newImages = [...product.productImages];
      newImages[index + 1] = base64;
      updateProduct("productImages", newImages);
    }
  };

  // Handle drag and drop for main image
  const handleMainImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const base64 = await fileToBase64(file);
      const newImages = [...product.productImages];
      newImages[0] = base64;
      updateProduct("productImages", newImages);
    }
  };

  // Handle drag and drop for additional images
  const handleAdditionalImageDrop = async (index: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const base64 = await fileToBase64(file);
      const newImages = [...product.productImages];
      newImages[index + 1] = base64;
      updateProduct("productImages", newImages);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSpecFieldChange = (sectionId: string, fieldId: string, type: "label" | "value", value: string) => {
    setSpecSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            fields: section.fields.map((field) => (field.id === fieldId ? { ...field, [type]: value } : field)),
          }
          : section,
      ),
    );
  };

  const addFieldToSection = (sectionId: string) => {
    setSpecSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            fields: [...section.fields, { id: `field${section.fields.length + 1}`, label: "", value: "" }],
          }
          : section,
      ),
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
      }),
    );
  };

  const updateSectionName = (sectionId: string, name: string) => {
    setSpecSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, name } : section)));
  };

  const removeSection = (sectionId: string) => {
    if (sectionId === "general" || sectionId === "warranty") return;
    setSpecSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const addNewSection = () => {
    const newSectionId = `section${Date.now()}`;
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
      formData.append("tags", JSON.stringify(tags));
      
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product.name) return alert("Product name is required");
    if (!product.category) return alert("Category is required");
    if (!product.brand) return alert("Brand is required");
    if (!product.color) return alert("At least one color is required");
    const colors = parseColors(product.color);
    if (colors.length === 0 || !colors.some((c) => isValidColor(c))) {
      return alert("Please enter at least one valid color (e.g., Red, #FF0000)");
    }
    if (!product.mrp) return alert("MRP is required");
    if (!product.ourPrice) return alert("Our price is required");
    if (!product.totalStocks) return alert("Total stock is required");
    if (!product.productImages[0]) return alert("Main product image is required");

    const generalSection = specSections.find((section) => section.id === "general");
    if (
      !generalSection ||
      !generalSection.fields.some((field) => field.label.trim() && field.value.trim())
    ) {
      return alert("At least one field in the General section is required");
    }

    const slug = product.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("slug", slug);
    formData.append("description", product.shortDescription || "");
    formData.append("category", product.category);
    formData.append("brand", product.brand);
    formData.append("color", product.color);
    formData.append("mrp", product.mrp);
    formData.append("ourPrice", product.ourPrice);
    formData.append("deliveryMode", product.deliveryMode);
    formData.append("sku", product.sku || "");
    formData.append("status", product.status);
    formData.append("subProductStatus", product.subProductStatus);
    formData.append("totalStocks", product.totalStocks);
    if (product.weight) formData.append("weight", product.weight);
    if (product.dimensions) formData.append("dimensions", product.dimensions);
    if (product.material) formData.append("material", product.material);

    addTagsToFormData(formData, product.tags);

    const specificationsPayload = specSections.map((section) => ({
      groupName: section.name,
      fields: section.fields
        .filter((f) => f.label.trim() !== "")
        .map((f) => ({
          fieldName: f.label,
          fieldValue: f.value,
        })),
    }));
    formData.append("specifications", JSON.stringify(specificationsPayload));

    let mainImageAdded = false;
    const mainImage = product.productImages[0];
    if (typeof mainImage === "string" && mainImage.startsWith("data:")) {
      try {
        const response = await fetch(mainImage);
        const blob = await response.blob();
        formData.append("productImages", blob, `main-image-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`);
        mainImageAdded = true;
      } catch (error) {
        console.error("Error converting base64 to blob:", error);
      }
    } else if (typeof mainImage === "string") {
      formData.append("productImages", mainImage);
      mainImageAdded = true;
    }

    if (!mainImageAdded) {
      return alert("Main product image could not be processed");
    }

    for (let i = 1; i < product.productImages.length; i++) {
      const image = product.productImages[i];
      if (!image) continue;
      if (typeof image === "string" && image.startsWith("data:")) {
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          formData.append(
            "productImages",
            blob,
            `additional-image-${Date.now()}-${i}.${blob.type.split("/")[1] || "jpg"}`,
          );
        } catch (error) {
          console.error(`Error converting additional image ${i} to blob:`, error);
        }
      } else if (typeof image === "string" && image) {
        formData.append("productImages", image);
      }
    }

    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: "PUT",
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
        throw new Error(result.message || "Failed to update product");
      }

      alert("Product updated successfully!");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-medium">Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-sm text-muted-foreground">Update product details in your inventory</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
            <div className="md:col-span-2">
              <div className="flex flex-col items-center">
                <div
                  className="relative h-[300px] w-full overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                  onDrop={handleMainImageDrop}
                  onDragOver={handleDragOver}
                >
                  {product.productImages[0] ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={typeof product.productImages[0] === "string" ? product.productImages[0] : "/placeholder.svg"}
                        alt="Main product image"
                        fill
                        className="object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = [...product.productImages];
                          newImages[0] = null;
                          updateProduct("productImages", newImages);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
                      onClick={() => mainImageInputRef.current?.click()}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="mt-2 text-sm font-medium text-blue-600">Upload Image</p>
                      <p className="text-xs text-gray-500">or drop a file</p>
                    </div>
                  )}
                  <input
                    ref={mainImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMainImageUpload}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {product.productImages.slice(1).map((image, index) => (
                  <div
                    key={index}
                    className="relative h-[140px] w-full overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                    onDrop={(e) => handleAdditionalImageDrop(index, e)}
                    onDragOver={handleDragOver}
                  >
                    {image ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={typeof image === "string" ? image : "/placeholder.svg"}
                          alt={`Additional image ${index + 1}`}
                          fill
                          className="object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = [...product.productImages];
                            newImages[index + 1] = null;
                            updateProduct("productImages", newImages);
                          }}
                          className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
                        onClick={() => additionalImageInputRefs.current[index]?.click()}
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
                        additionalImageInputRefs.current[index] = el
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAdditionalImageUpload(index, e)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <Input
                id="product-name"
                value={product.name}
                onChange={handleInputChange}
                placeholder="Product Name"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                Stock Keeping Unit (SKU)
              </label>
              <Input
                id="sku"
                value={product.sku}
                onChange={handleInputChange}
                placeholder="e.g. IP15-256-BLUE"
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
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                            updateProduct("category", cat);
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
                onChange={handleInputChange}
                placeholder="e.g. HP, Dell"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label htmlFor="colors" className="block text-sm font-medium text-gray-700">
                Colors
              </label>
              <div className="relative mt-1 flex items-center">
                <Input
                  id="colors"
                  value={product.color}
                  onChange={handleInputChange}
                  placeholder="e.g. Red, Blue, #000000"
                  className="pr-16"
                  required
                />
                <div className="absolute right-2 flex items-center space-x-1">
                  {parseColors(product.color).map((c, index) =>
                    isValidColor(c) ? (
                      <div
                        key={index}
                        className="h-4 w-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="material" className="block text-sm font-medium text-gray-700">
                Material
              </label>
              <Input
                id="material"
                value={product.material}
                onChange={handleInputChange}
                placeholder="e.g. Aluminum, Plastic"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">
                Dimensions
              </label>
              <Input
                id="dimensions"
                value={product.dimensions}
                onChange={handleInputChange}
                placeholder="e.g. 15 x 10 x 1 inches"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Weight
              </label>
              <Input
                id="weight"
                value={product.weight}
                onChange={handleInputChange}
                placeholder="e.g. 2.5 lbs"
                className="mt-1"
              />
            </div>

            {["Laptops", "Desktops"].includes(product.category) && (
              <div>
                <label htmlFor="storage" className="block text-sm font-medium text-gray-700">
                  Storage
                </label>
                <Input
                  id="storage"
                  value={product.storage || ""}
                  onChange={(e) => setProduct((prev) => ({ ...prev, storage: e.target.value }))}
                  placeholder="e.g. 256GB,512GB,1TB"
                  className="mt-1"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="mrp" className="block text-sm font-medium text-gray-700">
                MRP
              </label>
              <Input
                id="mrp"
                value={product.mrp}
                onChange={handleInputChange}
                placeholder="MRP e.g. ₹2000"
                className="mt-1"
                type="number"
                required
              />
            </div>

            <div>
              <label htmlFor="our-price" className="block text-sm font-medium text-gray-700">
                Our Price
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <Input
                  id="our-price"
                  value={product.ourPrice}
                  onChange={handleInputChange}
                  placeholder="20000"
                  className="pl-8"
                  type="number"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="relative mt-1 dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => toggleDropdown("status")}
                >
                  <span>{product.status}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "status" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1 capitalize">
                      {statusOptions.map((option) => (
                        <div
                          key={option}
                          className="cursor-pointer capitalize px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            updateProduct("status", option);
                            setOpenDropdown(null);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="total-stocks" className="block text-sm font-medium text-gray-700">
                Total Stocks
              </label>
              <Input
                id="total-stocks"
                value={product.totalStocks}
                onChange={handleInputChange}
                placeholder="Enter your stocks"
                className="mt-1"
                type="number"
                required
              />
            </div>

            <div>
              <label htmlFor="sub-status" className="block text-sm font-medium text-gray-700">
                Sub Product Status
              </label>
              <div className="relative mt-1 dropdown-container">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => toggleDropdown("subStatus")}
                >
                  <span>{product.subProductStatus}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "subStatus" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1 capitalize">
                      {statusOptions.map((option) => (
                        <div
                          key={option}
                          className="cursor-pointer capitalize px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            updateProduct("subProductStatus", option);
                            setOpenDropdown(null);
                          }}
                        >
                          {option}
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
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => toggleDropdown("deliveryMode")}
                >
                  <span>{product.deliveryMode}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "deliveryMode" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1 capitalize">
                      {["Standard", "Express"].map((option) => (
                        <div
                          key={option}
                          className="cursor-pointer px-4 capitalize py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            updateProduct("deliveryMode", option);
                            setOpenDropdown(null);
                          }}
                        >
                          {option}
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
                value={product.tags}
                onChange={handleInputChange}
                placeholder="e.g. gaming, portable, lightweight"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="short-description" className="block text-sm font-medium text-gray-700">
              Short Description
            </label>
            <textarea
              id="short-description"
              value={product.shortDescription}
              onChange={handleInputChange}
              placeholder="Brief description of the product"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={4}
            />
          </div>

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

          {product.subProductStatus === "Active" && (
            <div>
              <h2 className="mb-4 text-lg font-medium">Sub Products</h2>
              <SubProductSelector />
            </div>
          )}

          <div className="flex justify-center">
            <Button
              type="submit"
              className="mt-14 my-5 w-[40%] rounded-full bg-blue-600 px-8 py-2 text-white hover:bg-blue-700"
            >
              Update Product
            </Button>
          </div>
        </form>
      </div>
    </DndProvider>
  );
}