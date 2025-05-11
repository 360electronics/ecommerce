"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout"
import { deleteProducts, fetchProducts } from "@/utils/products.util"
import { Product } from "@/types/product"



// Available product categories
const productCategories = ["Laptops", "Desktops", "Accessories", "Peripherals", "Components"]

export function ProductsTable() {
  const router = useRouter()
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)


  console.log(selectedProducts)

  // Column definitions for Product Table
  const productColumns: ColumnDefinition<Product>[] = [
    {
      key: "productImages",
      header: "Thumbnail",
      width: "100px",
      align: "left",
      renderCell: (value, product) => {
        // Check if productImages exists and has at least one image URL
        if (product.productImages && product.productImages.length > 0) {
          const imageUrl = product.productImages[0];
          
          return (
            <div className="flex justify-start items-center h-16">
              <Image 
                src={imageUrl ?? '/placeholder.png'} 
                alt={`${product.name} thumbnail`}
                width={60}
                height={60}
                className="object-contain h-full w-auto rounded-md"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = "/placeholder-product.png";
                }}
              />
            </div>
          );
        }
        
        // Fallback for products without images
        return (
          <div className="bg-gray-200 w-12 h-12 rounded-md flex items-center justify-center mx-auto">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Product Name",
      sortable: true,
      width: "25%",
      align:'left'
    },
    {
      key: "mrp",
      header: "MRP",
      sortable: true,
      width: "15%",
      align: "left",
      renderCell: (value) => `₹${value.toLocaleString()}`, // Assuming you're using Indian Rupees
    },
    {
      key: "ourPrice",
      header: "Our Price",
      sortable: true,
      width: "15%",
      align: "left",
      renderCell: (value) => `₹${value.toLocaleString()}`,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      width: "15%",
      filterOptions: productCategories,
    },
    {
      key: "totalStocks",
      header: "Total Stocks",
      sortable: true,
      width: "15%",
      align: "left",
      renderCell: (value) => {
        const stockLevel = Number(value)
        let stockClass = "text-green-600"

        if (stockLevel <= 5) {
          stockClass = "text-red-600 font-bold"
        } else if (stockLevel <= 20) {
          stockClass = "text-amber-600"
        }

        return <span className={stockClass}>{value}</span>
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "10%",
      align: "left",
      renderCell: (value) => {
        let statusClass = "";
        const statusDisplay = value;
        
        switch(value?.toLowerCase()) {
          case "active":
            statusClass = "bg-green-100 text-green-800 ";
            break;
          case "inactive":
            statusClass = "bg-gray-100 text-gray-800 ";
            break;
          case "out of stock":
            statusClass = "bg-red-100 text-red-800 ";
            break;
          default:
            statusClass = "bg-blue-100 text-blue-800 ";
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}>
            {statusDisplay}
          </span>
        );
      },
    },
  ]

  // Handle product actions
  const handleAddProduct = () => {
    router.push("/admin/products/add-product")
  }

  const handleEditProduct = (products: Product[]) => {
    if (products.length === 1) {
      // Use the dynamic route with category and product ID
      router.push(`/admin/products/edit-product/${products[0].slug}`)
    } else {
      router.push(`/admin/products/bulk-edit?ids=${products.map((p) => p.id).join(",")}`)
    }
  }

  const handleViewProduct = (product: Product) => {
    router.push(`/admin/products/${product.id}`)
  }

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        const res = await deleteProducts([product.id!]);
        if (res) {
          setProducts((prev) => prev.filter((p) => p.id !== product.id));
          alert(`${product.name} deleted successfully.`);
        }
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Error deleting product. Please try again.");
      }
    }
  };
  
  const handleBulkDelete = async (products: Product[]) => {
    if (products.length === 0) return;
  
    if (window.confirm(`Are you sure you want to delete ${products.length} products?`)) {
      const ids = products.map((p) => p.id!);
      try {
        const res = await deleteProducts(ids);
        if (res) {
          setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
          alert(`${products.length} products deleted successfully.`);
        }
      } catch (error) {
        console.error("Failed to bulk delete products:", error);
        alert("Error deleting products. Please try again.");
      }
    }
  };
  
  

  const handleExportProducts = (products: Product[]) => {
    console.log("Export products:", products)
    // Implement export logic here
  }



  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts()
        if (data) {
          // Ensure productImages is always an array
          const normalizedData = data.map((product: { productImages: any }) => ({
            ...product,
            productImages: Array.isArray(product.productImages) 
              ? product.productImages 
              : product.productImages 
                ? [product.productImages] 
                : []
          }))
          setProducts(normalizedData)
        }
        console.log("Fetched products:", data)
      } catch (error) {
        console.error("Error loading products:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  if (loading) return <p>Loading products...</p>

  return (
    <EnhancedTable
      id="products-table"
      data={products}
      columns={productColumns}
      selection={{
        enabled: true,
        onSelectionChange: setSelectedProducts,
        selectionKey: "id",
      }}
      search={{
        enabled: true,
        keys: ["name", "category"],
        placeholder: "Search products...",
      }}
      filters={{
        enabled: false, // Disable filters
      }}
      pagination={{
        enabled: true,
        pageSizeOptions: [5, 10, 25, 50],
        defaultPageSize: 10,
      }}
      sorting={{
        enabled: true,
        defaultSortColumn: "name",
        defaultSortDirection: "asc",
      }}
      actions={{
        onAdd: handleAddProduct,
        addButtonText: "Add Product",
        bulkActions: {
          delete: handleBulkDelete,
          export: handleExportProducts,
          edit: handleEditProduct,
        },
        rowActions: {
          view: handleViewProduct,
          edit: (product) => handleEditProduct([product]),
          delete: handleDeleteProduct,
        },
      }}
      customization={{
        rowHoverEffect: true,
        zebraStriping: false,
        stickyHeader: true,
      }}
      onRowClick={(product) => router.push(`/product/${product.slug}`)}
    />
  )
}