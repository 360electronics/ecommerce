"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout";
import { deleteProducts, fetchProducts } from "@/utils/products.util";
import toast, { Toaster } from "react-hot-toast";
import { encodeUUID } from "@/utils/Encryption";

// Define the structure of a variant
interface Variant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  slug: string;
  color: string;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  storage: string | null;
  stock: string;
  mrp: string;
  ourPrice: string;
  productImages: string[];
  createdAt: string;
  updatedAt: string;
}

// Define the structure of a specification group
interface SpecificationGroup {
  groupName: string;
  fields: { fieldName: string; fieldValue: string }[];
}

// Define the structure of a product
interface Product {
  id: string;
  shortName: string;
  description: string | null;
  category: string;
  brand: string;
  status: "active" | "inactive";
  subProductStatus: "active" | "inactive";
  totalStocks: string;
  deliveryMode: "standard" | "express";
  tags: string | null;
  specifications: SpecificationGroup[];
  averageRating: string;
  ratingCount: string;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
}

// Define the structure of a table row (variant with product data)
interface TableRow {
  productId: string;
  shortName: string;
  category: string;
  brand: string;
  status: "active" | "inactive";
  totalStocks: string;
  variantId: string;
  variantName: string;
  sku: string;
  slug: string;
  color: string;
  stock: string;
  mrp: string;
  ourPrice: string;
  productImages: string[];
}

// Available product categories
const productCategories = ["Laptops", "Monitors", "Processor", "Graphics Card", "Accessories", "Storage", "Cabinets"];

export function ProductsTable() {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<TableRow[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);

  console.log(selectedRows)

  // Column definitions for Variant-based Table
  const columns: ColumnDefinition<TableRow>[] = [
    {
      key: "productImages",
      header: "Thumbnail",
      width: "100px",
      align: "left",
      renderCell: (_, row) => {
        if (row.productImages?.length > 0) {
          const imageUrl = row.productImages[0];
          return (
            <div className="flex justify-start items-center h-16">
              <Image
                src={imageUrl ?? "/placeholder.png"}
                alt={`${row.variantName} thumbnail`}
                width={60}
                height={60}
                className="object-contain h-full w-auto rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-product.png";
                }}
              />
            </div>
          );
        }
        return (
          <div className="bg-gray-200 w-12 h-12 rounded-md flex items-center justify-center mx-auto">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        );
      },
    },
    {
      key: "shortName",
      header: "Product Name",
      sortable: true,
      width: "20%",
      align: "left",
      renderCell: (_, row) => row.shortName,
    },
    {
      key: "variantName",
      header: "Variant Name",
      sortable: true,
      width: "15%",
      align: "left",
      renderCell: (_, row) => row.variantName,
    },
    {
      key: "color",
      header: "Color",
      sortable: true,
      width: "10%",
      align: "left",
      renderCell: (_, row) => row.color,
    },
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      width: "10%",
      align: "left",
      renderCell: (_, row) => row.sku,
    },
    {
      key: "mrp",
      header: "MRP",
      sortable: true,
      width: "10%",
      align: "left",
      renderCell: (_, row) => `₹${Number(row.mrp).toLocaleString()}`,
    },
    {
      key: "ourPrice",
      header: "Our Price",
      sortable: true,
      width: "10%",
      align: "left",
      renderCell: (_, row) => `₹${Number(row.ourPrice).toLocaleString()}`,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      width: "10%",
      filterOptions: productCategories,
      renderCell: (_, row) => row.category,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      width: "10%",
      align: "left",
      renderCell: (_, row) => {
        const stockLevel = Number(row.stock);
        let stockClass = "text-green-600";
        if (stockLevel <= 5) {
          stockClass = "text-red-600 font-bold";
        } else if (stockLevel <= 20) {
          stockClass = "text-amber-600";
        }
        return <span className={stockClass}>{row.stock}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "10%",
      align: "left",
      renderCell: (_, row) => {
        let statusClass = "";
        const statusDisplay = row.status;
        switch (statusDisplay?.toLowerCase()) {
          case "active":
            statusClass = "bg-green-100 text-green-800";
            break;
          case "inactive":
            statusClass = "bg-gray-100 text-gray-800";
            break;
          default:
            statusClass = "bg-blue-100 text-blue-800";
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}>
            {statusDisplay}
          </span>
        );
      },
    },
  ];

  // Flatten products into variant-based rows
  const flattenProducts = (products: Product[]): TableRow[] => {
    return products.flatMap((product) =>
      product.variants.map((variant) => ({
        productId: product.id,
        shortName: product.shortName,
        category: product.category,
        brand: product.brand,
        status: product.status,
        totalStocks: product.totalStocks,
        variantId: variant.id,
        variantName: variant.name,
        sku: variant.sku,
        slug: variant.slug,
        color: variant.color,
        stock: variant.stock,
        mrp: variant.mrp,
        ourPrice: variant.ourPrice,
        productImages: variant.productImages,
      }))
    );
  };

  // Handle product actions
  const handleAddProduct = () => {
    router.push("/admin/products/add-product");
  };

  const handleEditProduct = (rows: TableRow[]) => {
    if (rows.length === 1) {
      router.push(`/admin/products/edit-product/${rows[0].productId}`);
    } else {
      const productIds = [...new Set(rows.map((row) => row.productId))];
      router.push(`/admin/products/bulk-edit?ids=${productIds.join(",")}`);
    }
  };

  const handleViewProduct = (row: TableRow) => {
    router.push(`/product/${row.slug}`);
  };

  const handleDeleteProduct = async (row: TableRow) => {
    if (window.confirm(`Are you sure you want to delete ${row.shortName} (${row.variantName})?`)) {
      try {
        const res = await deleteProducts([row.productId]);
        if (res) {
          setTableData((prev) => prev.filter((r) => r.productId !== row.productId));
          toast(`${row.shortName} deleted successfully.`);
        }
      } catch (error) {
        console.error("Failed to delete product:", error);
        toast("Error deleting product. Please try again.");
      }
    }
  };

  const handleBulkDelete = async (rows: TableRow[]) => {
    if (rows.length === 0) return;
    const productIds = [...new Set(rows.map((row) => row.productId))];
    if (window.confirm(`Are you sure you want to delete ${productIds.length} products?`)) {
      try {
        const res = await deleteProducts(productIds);
        if (res) {
          setTableData((prev) => prev.filter((r) => !productIds.includes(r.productId)));
          toast(`${productIds.length} products deleted successfully.`);
        }
      } catch (error) {
        console.error("Failed to bulk delete products:", error);
        toast("Error deleting products. Please try again.");
      }
    }
  };

  const handleExportProducts = (rows: TableRow[]) => {
    const productIds = [...new Set(rows.map((row) => row.productId))];
    console.log("Export products with IDs:", productIds);
    // Implement export logic here
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts();
        if (data) {
          const flattenedData = flattenProducts(data);
          setTableData(flattenedData);
        }
        // console.log("Fetched products:", data);
      } catch (error) {
        console.error("Error loading products:", error);
        toast("Error loading products. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) return <p>Loading products...</p>;



  return (
    <>
      <Toaster />
      <EnhancedTable
        id="products-table"
        data={tableData}
        columns={columns}
        selection={{
          enabled: true,
          onSelectionChange: setSelectedRows,
          selectionKey: "variantId", // Unique per variant
        }}
        search={{
          enabled: true,
          keys: ["shortName", "variantName", "sku", "color", "category"],
          placeholder: "Search products or variants...",
        }}
        filters={{
          enabled: true,
        }}
        pagination={{
          enabled: true,
          pageSizeOptions: [5, 10, 25, 50],
          defaultPageSize: 10,
        }}
        sorting={{
          enabled: true,
          defaultSortColumn: "shortName",
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
            edit: (row) => handleEditProduct([row]),
            delete: handleDeleteProduct,
          },
        }}
        customization={{
          rowHoverEffect: true,
          zebraStriping: false,
          stickyHeader: true,
        }}
        onRowClick={(row) => {
          const encodedProductId = row.productId ? encodeUUID(row.productId) : '';
          console.log(`Row clicked - productId: ${row.productId}, Encoded: ${encodedProductId}, Slug: ${row.slug}`);
          router.push(`/product/${encodedProductId}/${row.slug}`);
        }}
      />
    </>
  );
}