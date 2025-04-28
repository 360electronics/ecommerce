"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout"

// Define Product type
interface Product {
  id: string
  thumbnail: string
  name: string
  marketPrice: number
  sellingPrice: number
  category: string
  stock: number
  status: string
}

// Sample product data
const productData: Product[] = [
  {
    id: "1",
    thumbnail: "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    name: "Gaming Laptop",
    marketPrice: 95000,
    sellingPrice: 89999,
    category: "PC",
    stock: 12,
    status: "active",
  },
  {
    id: "2",
    thumbnail: "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    name: "Mechanical Keyboard",
    marketPrice: 8500,
    sellingPrice: 7999,
    category: "Accessories",
    stock: 45,
    status: "active",
  },
  {
    id: "3",
    thumbnail: "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    name: "Gaming Mouse",
    marketPrice: 4500,
    sellingPrice: 3999,
    category: "Accessories",
    stock: 78,
    status: "active",
  },
  {
    id: "4",
    thumbnail: "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    name: "27-inch Monitor",
    marketPrice: 28000,
    sellingPrice: 25999,
    category: "Monitors",
    stock: 15,
    status: "active",
  },
  {
    id: "5",
    thumbnail: "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    name: "Gaming Headset",
    marketPrice: 12000,
    sellingPrice: 10999,
    category: "Audio",
    stock: 32,
    status: "active",
  },
  {
    id: "6",
    thumbnail: "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    name: "Graphics Card",
    marketPrice: 65000,
    sellingPrice: 59999,
    category: "Components",
    stock: 8,
    status: "inactive",
  },
  {
    id: "7",
    thumbnail: "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    name: "Gaming Chair The examples on this page walk through basic username and password auth for educational purposes. While you can implement a custom auth solution, for increased security and simplicity, we recommend using an authentication library.",
    marketPrice: 18000,
    sellingPrice: 15999,
    category: "Furniture",
    stock: 20,
    status: "active",
  },
  {
    id: "8",
    thumbnail: "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    name: "SSD 1TB",
    marketPrice: 12000,
    sellingPrice: 9999,
    category: "Storage",
    stock: 50,
    status: "active",
  },
]

// Available product categories
const productCategories = ["PC", "Accessories", "Monitors", "Audio", "Components", "Furniture", "Storage", "All"]

export function ProductsTable() {
  const router = useRouter()
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  // Column definitions for Product Table
  const productColumns: ColumnDefinition<Product>[] = [
    {
      key: "thumbnail",
      header: "Thumbnail",
      width: "100px",
      align: "center",
    },
    {
      key: "name",
      header: "Product Name",
      sortable: true,
      width: "25%",
    },
    {
      key: "marketPrice",
      header: "Market Price",
      sortable: true,
      width: "15%",
      align: "right",
    },
    {
      key: "sellingPrice",
      header: "Selling Price",
      sortable: true,
      width: "15%",
      align: "right",
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      width: "15%",
      filterOptions: productCategories,
    },
    {
      key: "stock",
      header: "Stock Available",
      sortable: true,
      width: "15%",
      align: "center",
      renderCell: (value, item) => {
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
      align: "center",
    },
  ]

  // Handle product actions
  const handleAddProduct = () => {
    router.push("/admin/products/add-product")
  }

  const handleEditProduct = (products: Product[]) => {
    if (products.length === 1) {
      // Use the dynamic route with category and product ID
      router.push(`/admin/products/edit-product/${products[0].category}/${products[0].id}`)
    } else {
      router.push(`/admin/products/bulk-edit?ids=${products.map((p) => p.id).join(",")}`)
    }
  }

  const handleViewProduct = (product: Product) => {
    router.push(`/admin/products/${product.id}`)
  }

  const handleDeleteProduct = (product: Product) => {
    // Show confirmation dialog and delete product
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      console.log("Delete product:", product)
      // Implement delete logic here
    }
  }

  const handleBulkDelete = (products: Product[]) => {
    if (window.confirm(`Are you sure you want to delete ${products.length} products?`)) {
      console.log("Delete products:", products)
      // Implement bulk delete logic here
    }
  }

  const handleExportProducts = (products: Product[]) => {
    console.log("Export products:", products)
    // Implement export logic here
  }

  return (
    <EnhancedTable
      id="products-table"
      data={productData}
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
          // view: handleViewProduct,
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
      onRowClick={(product) => router.push(`/admin/products/${product.id}`)}
    />
  )
}
