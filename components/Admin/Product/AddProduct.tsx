"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ChevronDown, Plus, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SubProductSelector } from "@/components/Admin/Product/SubProductSelector"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

// Status options - simplified to just active/inactive
const statusOptions = ["Active", "Inactive"]

// Interface for specification field
interface SpecField {
  id: string
  label: string
  value: string
}

// Interface for specification section
interface SpecSection {
  id: string
  name: string
  fields: SpecField[]
  isRequired?: boolean
  isFixed?: boolean
}

// Product categories
const categories = ["Laptops", "Desktops", "Accessories", "Peripherals", "Components"]

// Type for drag item
interface DragItem {
  index: number
  id: string
  type: string
}

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
  section: SpecSection
  index: number
  moveSection: (dragIndex: number, hoverIndex: number) => void
  handleSpecFieldChange: (sectionId: string, fieldId: string, type: "label" | "value", value: string) => void
  addFieldToSection: (sectionId: string) => void
  updateSectionName: (sectionId: string, name: string) => void
  removeSection: (sectionId: string) => void
  removeFieldFromSection: (sectionId: string, fieldId: string) => void
}) => {
  const ref = useRef<HTMLDivElement>(null)

  // Determine if this section can be dragged
  // General and Warranty sections are fixed
  const canDrag = !section.isFixed

  const [{ isDragging }, drag] = useDrag({
    type: "SPEC_SECTION",
    item: () => ({ index, id: section.id, type: "SPEC_SECTION" }),
    canDrag: canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "SPEC_SECTION",
    canDrop: (item: DragItem) => {
      // Don't allow dropping on fixed sections
      if (section.isFixed) return false

      // Don't allow dropping General or Warranty sections
      if (item.id === "general") return false

      return true
    },
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return

      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return

      // Don't allow moving items to the position of fixed sections
      if (section.isFixed) return

      // Get rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Get mouse position
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) return

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return

      // Time to actually perform the action
      moveSection(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  // Apply drag and drop refs
  // Use the callback pattern to properly combine refs
  const attachRef = (el: HTMLDivElement | null) => {
    ref.current = el

    // Apply the drop ref to all sections
    const dropRef = drop(el)

    // Only apply drag ref to draggable sections
    if (canDrag) {
      drag(el)
    }
  }

  // Determine border style based on drag state
  const borderStyle = isOver && canDrop ? "border-blue-400" : isOver && !canDrop ? "border-red-400" : "border-gray-200"

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
                placeholder={`label name ( eg: ${section.name === "General" ? "Model name, Brand" : section.name === "Warranty" ? "Warranty Summary" : "Processor And Features"} )`}
                value={field.label}
                onChange={(e) => handleSpecFieldChange(section.id, field.id, "label", e.target.value)}
              />
            </div>
            <div className="relative flex items-center">
              <Input
                placeholder={`value name ( eg: ${section.name === "General" ? "HP DELL" : section.name === "Warranty" ? "DOMESTIC" : "ON SITE WARRANTY"} )`}
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
  )
}

export default function AddProductPage() {
  const router = useRouter()

  // Main product image state
  const [mainImage, setMainImage] = useState<string>("")

  // Additional images state
  const [additionalImages, setAdditionalImages] = useState<string[]>(Array(5).fill(""))

  // Form state
  const [productName, setProductName] = useState("")
  const [sku, setSku] = useState("")
  const [category, setCategory] = useState("")
  const [mrp, setMrp] = useState("")
  const [ourPrice, setOurPrice] = useState("")
  const [status, setStatus] = useState("Active")
  const [subStatus, setSubStatus] = useState("Active")
  const [totalStock, setTotalStock] = useState("")
  const [deliveryMode, setDeliveryMode] = useState("Standard")

  // Dropdowns state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Specifications state - mark General and Warranty as fixed
  const [specSections, setSpecSections] = useState<SpecSection[]>([
    {
      id: "general",
      name: "General",
      fields: [{ id: "field1", label: "", value: "" }],
      isRequired: true,
      isFixed: true,
    },
  ])

  // File input refs
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const additionalImageInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // useEffect to initialize the array of refs
  useEffect(() => {
    // Create an array of refs for additional images
    additionalImageInputRefs.current = Array(5).fill(null)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest(".dropdown-container")) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openDropdown])

  // Handle dropdown toggle
  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName)
  }

  // Handle main image upload
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setMainImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle additional image upload
  const handleAdditionalImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImages = [...additionalImages]
          newImages[index] = event.target.result as string
          setAdditionalImages(newImages)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle drag and drop for main image
  const handleMainImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setMainImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle drag and drop for additional images
  const handleAdditionalImageDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImages = [...additionalImages]
          newImages[index] = event.target.result as string
          setAdditionalImages(newImages)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Prevent default behavior for drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle specification field change
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
    )
  }

  // Add new field to a section
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
    )
  }

  // Remove a field from a section
  const removeFieldFromSection = (sectionId: string, fieldId: string) => {
    setSpecSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          // Don't remove the last field
          if (section.fields.length <= 1) {
            return section
          }
          return {
            ...section,
            fields: section.fields.filter((field) => field.id !== fieldId),
          }
        }
        return section
      }),
    )
  }

  // Update section name
  const updateSectionName = (sectionId: string, name: string) => {
    setSpecSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, name } : section)))
  }

  // Remove a section
  const removeSection = (sectionId: string) => {
    // Don't allow removing fixed sections
    if (sectionId === "general" || sectionId === "warranty") return

    setSpecSections((prev) => prev.filter((section) => section.id !== sectionId))
  }

  // Add new section
  const addNewSection = () => {
    const newSectionId = `section${Date.now()}`

    // Insert new section before warranty (which should always be last)
    const warrantyIndex = specSections.findIndex((section) => section.id === "warranty")
    const newSections = [...specSections]

    newSections.splice(warrantyIndex, 0, {
      id: newSectionId,
      name: "New Row",
      fields: [{ id: "field1", label: "", value: "" }],
      isFixed: false, // New sections can be moved
    })

    setSpecSections(newSections)
  }

  // Move section (for drag and drop)
  const moveSection = (dragIndex: number, hoverIndex: number) => {
    // Get the section being dragged
    const dragSection = specSections[dragIndex]

    // Don't allow moving fixed sections
    if (dragSection.id === "general" || dragSection.id === "warranty") return

    // Don't allow moving to the position of fixed sections
    // General is always at index 0
    if (hoverIndex === 0) return

    // Warranty is always at the last index
    if (hoverIndex === specSections.length - 1) return

    // Perform the move
    setSpecSections((prevSections) => {
      const newSections = [...prevSections]
      newSections.splice(dragIndex, 1)
      newSections.splice(hoverIndex, 0, dragSection)
      return newSections
    })
  }

  // Enhanced form submission with debugging
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started");

    // Log all form values for debugging
    console.log({
      productName,
      category,
      mrp,
      ourPrice,
      totalStock,
      sku,
      status,
      subStatus,
      deliveryMode,
      // description,
      mainImage: mainImage ? `${typeof mainImage} (${mainImage instanceof File ? mainImage.name : 'not a file'})` : 'none',
      additionalImages: additionalImages.map(img =>
        typeof img === 'string' ? 'string URL' : (img instanceof File ? `File: ${img.name}` : 'unknown type')
      )
    });

    // Basic validations
    if (!productName) return alert("Product name is required");
    if (!category) return alert("Category is required");
    if (!mrp) return alert("MRP is required");
    if (!ourPrice) return alert("Our price is required");
    if (!totalStock) return alert("Total stock is required");

    // General section must have at least one filled field
    const generalSection = specSections.find((section) => section.id === "general");
    if (
      !generalSection ||
      !generalSection.fields.some((field) => field.label.trim() && field.value.trim())
    ) {
      return alert("At least one field in the General section is required");
    }

    // Create FormData object for file uploads
    const formData = new FormData();

    // Add text fields
    formData.append("name", productName);
    formData.append("slug", productName.toLowerCase().replace(/\s+/g, "-"));
    // formData.append("description", description || "");
    formData.append("category", category);
    formData.append("mrp", mrp);
    formData.append("ourPrice", ourPrice);
    formData.append("deliveryMode", deliveryMode);
    formData.append("sku", sku || "");
    formData.append("status", status);
    formData.append("subProductStatus", subStatus);
    formData.append("totalStocks", totalStock);

    // Add specifications as JSON string
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

    // Debug the file objects
    console.log("Main image:", mainImage);
    if (mainImage instanceof File) {
      console.log("Main image details:", {
        name: mainImage.name,
        type: mainImage.type,
        size: mainImage.size,
        lastModified: mainImage.lastModified
      });
    }

    // Handle main image
    let mainImageAdded = false;
    if (mainImage instanceof File && mainImage.size > 0) {
      console.log("Appending main image as File:", mainImage.name);
      formData.append("productImages", mainImage);
      mainImageAdded = true;
    } else if (typeof mainImage === "string") {
      if (mainImage.startsWith("data:")) {
        // It's a base64 image
        try {
          console.log("Converting base64 main image to blob");
          const response = await fetch(mainImage);
          const blob = await response.blob();
          console.log("Blob created:", blob.size, blob.type);
          formData.append("productImages", blob, `main-image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`);
          mainImageAdded = true;
        } catch (error) {
          console.error("Error converting base64 to blob:", error);
        }
      } else if (mainImage.startsWith("http")) {
        // It's a URL - might need special handling depending on your setup
        console.log("Main image is a URL, not handling:", mainImage);
        // You might need to fetch this image and convert it to a blob
      }
    }

    if (!mainImageAdded) {
      console.warn("No main image was added to formData");
      return alert("Main product image is required and could not be processed");
    }

    // Add additional images
    let additionalImagesAdded = 0;
    for (let i = 0; i < additionalImages.length; i++) {
      const image = additionalImages[i];
      if (image instanceof File && image.size > 0) {
        console.log(`Appending additional image ${i} as File:`, image.name);
        formData.append("productImages", image);
        additionalImagesAdded++;
      } else if (typeof image === "string" && image.startsWith("data:")) {
        try {
          console.log(`Converting base64 additional image ${i} to blob`);
          const response = await fetch(image);
          const blob = await response.blob();
          formData.append("productImages", blob, `additional-image-${Date.now()}-${i}.${blob.type.split('/')[1] || 'jpg'}`);
          additionalImagesAdded++;
        } catch (error) {
          console.error(`Error converting additional image ${i} to blob:`, error);
        }
      }
    }

    console.log(`Added ${additionalImagesAdded} additional images`);

    // Log all FormData entries for debugging
    console.log("FormData entries:");
    for (const pair of formData.entries()) {
      if (pair[0] === "productImages") {
        console.log(`${pair[0]}: [File object]`);
      } else if (pair[0] === "specifications") {
        console.log(`${pair[0]}: [JSON string length: ${(pair[1] as string).length}]`);
      } else {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
    }

    try {
      console.log("Sending fetch request to /api/products");
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", res.status);
      console.log("Response status text:", res.statusText);

      // Try to get the response body as text first to ensure we can see it even if it's not valid JSON
      const responseText = await res.text();
      console.log("Raw response:", responseText);

      let result;
      try {
        // Try to parse as JSON if possible
        result = JSON.parse(responseText);
        console.log("Parsed response:", result);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        // Continue with the text response
        result = { message: responseText };
      }

      if (!res.ok) {
        throw new Error(result.message || responseText || "Failed to create product");
      }

      // Success!
      console.log("Product created successfully:", result);
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
            <p className="text-sm text-muted-foreground">Create a new product in your inventory</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Product Images Section */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
            {/* Main Product Image */}
            <div className="md:col-span-2">
              <div className="flex flex-col items-center">
                <div
                  className="relative h-[300px] w-full overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                  onDrop={handleMainImageDrop}
                  onDragOver={handleDragOver}
                >
                  {mainImage ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={mainImage}
                        alt="Main product image"
                        fill
                        className="object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setMainImage("")}
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

            {/* Additional Images */}
            <div className="md:col-span-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {additionalImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative h-[140px] w-full overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                    onDrop={(e) => handleAdditionalImageDrop(index, e)}
                    onDragOver={handleDragOver}
                  >
                    {image ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`Additional image ${index + 1}`}
                          fill
                          className="object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = [...additionalImages]
                            newImages[index] = ""
                            setAdditionalImages(newImages)
                          }}
                          className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
                        onClick={() => {
                          const inputRef = additionalImageInputRefs.current[index]
                          if (inputRef) {
                            inputRef.click()
                          }
                        }}
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
                        if (additionalImageInputRefs.current) {
                          additionalImageInputRefs.current[index] = el
                        }
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

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Product Name */}
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product Name"
                className="mt-1"
                required
              />
            </div>

            {/* Stock Keeping Unit (SKU) */}
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                Stock Keeping Unit (SKU)
              </label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="eg. IP15-256-BLUE"
                className="mt-1"
                required
              />
            </div>

            {/* Category */}
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
                  <span>{category || "Select the Category"}</span>
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
                            setCategory(cat)
                            setOpenDropdown(null)
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

            {/* Market Price */}
            <div>
              <label htmlFor="mrp" className="block text-sm font-medium text-gray-700">
                MRP
              </label>
              <Input
                id="mrp"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="MRP eg. ₹2000"
                className="mt-1"
                type="number"
                required
              />
            </div>

            {/* Selling Price */}
            <div>
              <label htmlFor="our-price" className="block text-sm font-medium text-gray-700">
                Our Price
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <Input
                  id="our-price"
                  value={ourPrice}
                  onChange={(e) => setOurPrice(e.target.value)}
                  placeholder="20000"
                  className="pl-8"
                  type="number"
                  required
                />
              </div>
            </div>

            {/* Status */}
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
                  <span>{status}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "status" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1">
                      {statusOptions.map((option) => (
                        <div
                          key={option}
                          className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setStatus(option)
                            setOpenDropdown(null)
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

            {/* Total Stocks */}
            <div>
              <label htmlFor="total-stocks" className="block text-sm font-medium text-gray-700">
                Total Stocks
              </label>
              <Input
                id="total-stocks"
                value={totalStock}
                onChange={(e) => setTotalStock(e.target.value)}
                placeholder="Enter your stocks"
                className="mt-1"
                type="number"
                required
              />
            </div>

            {/* Sub Product Status */}
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
                  <span>{subStatus}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "subStatus" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1">
                      {statusOptions.map((option) => (
                        <div
                          key={option}
                          className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setSubStatus(option)
                            setOpenDropdown(null)
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

            {/*  Delivery Mode */}
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
                  <span>{deliveryMode}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {openDropdown === "deliveryMode" && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-60 overflow-auto py-1">
                      {['Standard', 'Express'].map((option) => (
                        <div
                          key={option}
                          className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setDeliveryMode(option)
                            setOpenDropdown(null)
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
          </div>

          {/* Product Specifications */}
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

          {/* Sub Products - Only show if subStatus is active */}
          {subStatus === "Active" && (
            <div>
              <h2 className="mb-4 text-lg font-medium">Sub Products</h2>
              <SubProductSelector />
            </div>
          )}

          {/* Submit Button - Centered and rounded-full */}
          <div className="flex justify-center">
            <button type="submit" className="bg-blue-600 mt-14 my-5 w-[40%] hover:bg-blue-700 text-white px-8 py-2 rounded-full">
              Add Product
            </button>
          </div>
        </form>
      </div>
    </DndProvider>
  )
}
