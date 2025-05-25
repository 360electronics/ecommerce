"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout";
import { deleteProducts, fetchProducts } from "@/utils/products.util";
import toast, { Toaster } from "react-hot-toast";
import { encodeUUID } from "@/utils/Encryption";

// Core Entity Types (as provided)
export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductImage = {
  url: string;
  alt: string;
  isFeatured: boolean;
  displayOrder: number;
};

export type ProductDimensions = {
  length: number;
  width: number;
  height: number;
  unit: string;
};

export type ProductSpecification = {
  groupName: string;
  fields: Array<{
    fieldName: string;
    fieldValue: string;
  }>;
};

export type ProductReview = {
  id: string;
  productId: string;
  variantId: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  slug: string;
  attributes: Record<string, string | number | boolean>;
  stock: number;
  lowStockThreshold: number | null;
  isBackorderable: boolean;
  mrp: number;
  ourPrice: number;
  salePrice: number | null;
  isOnSale: boolean;
  productImages: ProductImage[];
  weight: number | null;
  weightUnit: string | null;
  dimensions: ProductDimensions | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  inStock: boolean;
  discountPercentage: number | null;
  isLowStock: boolean;
  availabilityStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder';
};

export type ProductPromotion = {
  id: string;
  name: string;
  description: string | null;
  promoType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'bundle';
  value: number;
  code: string | null;
  minPurchase: number | null;
  maxDiscount: number | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RelatedProductSummary = {
  id: string;
  shortName: string;
  fullName: string;
  slug: string;
  status: 'active' | 'inactive' | 'coming_soon' | 'discontinued';
  averageRating: number;
  ratingCount: number;
  brandName: string;
  categoryName: string;
  defaultImage: string | null;
  price: {
    mrp: number;
    sellingPrice: number;
    discount: number | null;
    discountPercentage: number | null;
  };
};

export type CompleteProduct = {
  id: string;
  shortName: string;
  fullName: string;
  slug: string;
  description: string | null;
  category: Category;
  subcategory: Subcategory | null;
  brand: Brand;
  status: 'active' | 'inactive' | 'coming_soon' | 'discontinued';
  isFeatured: boolean;
  totalStocks: number;
  deliveryMode: 'standard' | 'express' | 'same_day' | 'pickup';
  tags: string[];
  attributes: Record<string, string | number | boolean>;
  specifications: ProductSpecification[];
  warranty: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  averageRating: number;
  ratingCount: number;
  variants: ProductVariant[];
  defaultVariant: ProductVariant;
  relatedProducts: Array<{
    relationType: 'similar' | 'accessory' | 'replacement' | 'bundle' | 'upsell';
    displayOrder: number;
    product: RelatedProductSummary;
  }>;
  compatibleWith: Array<{
    product: RelatedProductSummary;
    compatibilityNote: string | null;
  }>;
  reviews: ProductReview[];
  isInOfferZone: boolean;
  isNewArrival: boolean;
  isInGamersZone: boolean;
  gamersZoneCategory?: 'laptops' | 'desktops' | 'accessories' | 'consoles';
  activePromotions: Array<{
    promotion: ProductPromotion;
    applicableEntityType: 'product' | 'variant' | 'category' | 'subcategory' | 'brand';
  }>;
  createdAt: Date;
  updatedAt: Date;
  hasMultipleVariants: boolean;
  priceRange: { min: number; max: number } | null;
  allImages: ProductImage[];
  isDiscontinued: boolean;
  isComingSoon: boolean;
};

// Get unique categories and brands
const getProductCategories = (products: CompleteProduct[]): string[] => {
  return [...new Set(products.map((p) => p.category.name))].sort();
};

const getProductBrands = (products: CompleteProduct[]): string[] => {
  return [...new Set(products.map((p) => p.brand.name))].sort();
};

// Updated TableRow interface to match data structure
interface TableRow {
  productId: string;
  variantId: string;
  shortName: string;
  fullName: string;
  category: string;
  subcategory?: string;
  brand: string;
  status: 'active' | 'inactive' | 'coming_soon' | 'discontinued';
  isFeatured: boolean;
  isInOfferZone: boolean;
  averageRating: number;
  variantName: string;
  sku: string;
  slug: string;
  attributes: Record<string, string | number | boolean>;
  stock: number;
  mrp: number;
  ourPrice: number;
  salePrice?: number | null; // Updated to match ProductVariant
  productImages: ProductImage[];
  activePromotions: ProductPromotion[];
  priceRange: { min: number; max: number } | null;
  hasMultipleVariants: boolean;
}

export function ProductsTable() {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<TableRow[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [products, setProducts] = useState<CompleteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized filters
  const productCategories = useMemo(() => getProductCategories(products), [products]);
  const productBrands = useMemo(() => getProductBrands(products), [products]);

  // Column definitions
  const columns: ColumnDefinition<TableRow>[] = [
    {
      key: "productImages",
      header: "Thumbnail",
      width: "80px",
      renderCell: (_, row) => {
        const featuredImage = row.productImages.find((img) => img.isFeatured) || row.productImages[0];
        return featuredImage ? (
          <Image
            src={featuredImage.url}
            alt={featuredImage.alt}
            width={60}
            height={60}
            className="object-contain rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-product.png";
            }}
          />
        ) : (
          <div className="bg-gray-100 w-12 h-12 rounded-md flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        );
      },
    },
    {
      key: "fullName",
      header: "Product Name",
      sortable: true,
      width: "20%",
      renderCell: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.fullName}</span>
          <span className="text-sm text-gray-500">{row.shortName}</span>
          {row.hasMultipleVariants && (
            <span className="text-xs text-blue-500">Multiple Variants</span>
          )}
        </div>
      ),
    },
    {
      key: "variantName",
      header: "Variant",
      sortable: true,
      width: "12%",
      renderCell: (_, row) => row.variantName,
    },
    {
      key: "attributes",
      header: "Key Attributes",
      width: "15%",
      renderCell: (_, row) => {
        const keyAttrs = Object.entries(row.attributes)
          .slice(0, 2)
          .map(([key, value]) => `${key}: ${value}`);
        return keyAttrs.join(", ") || "-";
      },
    },
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      width: "10%",
      renderCell: (_, row) => row.sku,
    },
    {
      key: "ourPrice",
      header: "Our Price",
      sortable: true,
      width: "12%",
      renderCell: (_, row) => (
        <div className="flex flex-col">
          <span className="text-green-600">₹{Number(row.ourPrice).toLocaleString()}</span>
          {row.salePrice != null && (
            <span className="text-sm text-red-500 line-through">
              ₹{Number(row.mrp).toLocaleString()}
            </span>
          )}
          {row.activePromotions.length > 0 && (
            <span className="text-xs text-purple-500">
              {row.activePromotions[0].name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      width: "10%",
      filterOptions: productCategories,
      renderCell: (_, row) => (
        <span>
          {row.category}
          {row.subcategory && <span className="text-gray-500"> / {row.subcategory}</span>}
        </span>
      ),
    },
    {
      key: "brand",
      header: "Brand",
      sortable: true,
      width: "10%",
      filterOptions: productBrands,
      renderCell: (_, row) => row.brand,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      width: "8%",
      renderCell: (_, row) => {
        const stockLevel = Number(row.stock);
        const stockClass =
          stockLevel <= 5 ? "text-red-600 font-bold" :
            stockLevel <= 20 ? "text-amber-600" :
              "text-green-600";
        return <span className={stockClass}>{stockLevel}</span>;
      },
    },
    {
      key: "averageRating",
      header: "Rating",
      sortable: true,
      width: "8%",
      renderCell: (_, row) => (
        <span className="flex items-center">
          {typeof row.averageRating === 'number' && !isNaN(row.averageRating)
            ? row.averageRating.toFixed(1)
            : 'N/A'} ⭐
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "10%",
      filterOptions: ["active", "inactive", "coming_soon", "discontinued"],
      renderCell: (_, row) => {
        const statusStyles: Record<string, string> = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-gray-100 text-gray-800",
          coming_soon: "bg-blue-100 text-blue-800",
          discontinued: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[row.status.toLowerCase()]
              }`}
          >
            {row.status.replace("_", " ")}
            {row.isInOfferZone && (
              <span className="ml-1 text-purple-500">★</span>
            )}
          </span>
        );
      },
    },
  ];

  // Flatten products into variant-based rows
  const flattenProducts = (products: CompleteProduct[]): TableRow[] => {
    return products.flatMap((product) =>
      product.variants.map((variant) => ({
        productId: product.id,
        variantId: variant.id,
        shortName: product.shortName,
        fullName: product.fullName,
        category: product.category.name,
        subcategory: product.subcategory?.name,
        brand: product.brand.name,
        status: product.status,
        isFeatured: product.isFeatured,
        isInOfferZone: product.isInOfferZone,
        averageRating: product.averageRating,
        variantName: variant.name,
        sku: variant.sku,
        slug: variant.slug,
        attributes: variant.attributes,
        stock: variant.stock,
        mrp: variant.mrp,
        ourPrice: variant.ourPrice,
        salePrice: variant.salePrice,
        productImages: variant.productImages,
        activePromotions: Array.isArray(product.activePromotions)
          ? product.activePromotions
              .filter((promo) =>
                promo.applicableEntityType === "product" ||
                promo.applicableEntityType === "variant"
              )
              .map((p) => p.promotion)
          : [], // Fallback to empty array if activePromotions is not an array
        priceRange: product.priceRange,
        hasMultipleVariants: product.hasMultipleVariants,
      }))
    );
  };

  // Handle actions
  const handleAddProduct = () => router.push("/admin/products/add-product");

  const handleEditProduct = (rows: TableRow[]) => {
    if (rows.length === 1) {
      router.push(`/admin/products/edit-product/${rows[0].productId}`);
    } else {
      const productIds = [...new Set(rows.map((row) => encodeUUID(row.productId)))];
      router.push(`/admin/products/bulk-edit?ids=${productIds.join(",")}`);
    }
  };

  const handleViewProduct = (row: TableRow) => {
    router.push(`/product/${encodeUUID(row.productId)}/${row.slug}`);
  };

  const handleDeleteProduct = async (row: TableRow) => {
    if (window.confirm(`Delete ${row.fullName} (${row.variantName})?`)) {
      try {
        await deleteProducts([row.productId]);
        setTableData((prev) => prev.filter((r) => r.productId !== row.productId));
        setProducts((prev) => prev.filter((p) => p.id !== row.productId));
        toast.success(`${row.fullName} deleted successfully.`);
      } catch (error) {
        console.error("Failed to delete product:", error);
        toast.error("Failed to delete product.");
      }
    }
  };

  const handleBulkDelete = async (rows: TableRow[]) => {
    const productIds = [...new Set(rows.map((row) => row.productId))];
    if (productIds.length === 0) return;
    if (window.confirm(`Delete ${productIds.length} products?`)) {
      try {
        await deleteProducts(productIds);
        setTableData((prev) => prev.filter((r) => !productIds.includes(r.productId)));
        setProducts((prev) => prev.filter((p) => !productIds.includes(p.id)));
        toast.success(`${productIds.length} products deleted successfully.`);
      } catch (error) {
        console.error("Failed to bulk delete products:", error);
        toast.error("Failed to delete products.");
      }
    }
  };

  const handleExportProducts = (rows: TableRow[]) => {
    const productIds = [...new Set(rows.map((row) => row.productId))];
    toast.success(`Exporting ${productIds.length} products...`);
    // Implement CSV export logic
  };

  // Fetch products
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/products", { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch products");
        const data: CompleteProduct[] = await response.json();
        setProducts(data);
        setTableData(flattenProducts(data));
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products. Please try again.");
        toast.error("Error loading products.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (error) return (
    <div className="text-red-600 p-4 bg-red-50 rounded-md">
      {error}
      <button
        className="ml-4 text-blue-600 underline"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );

  if (loading) return (
    <div className="p-4 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading products...</span>
    </div>
  );

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow">
      <Toaster position="top-right" />
      <EnhancedTable
        id="products-table"
        data={tableData}
        columns={columns}
        selection={{
          enabled: true,
          onSelectionChange: setSelectedRows,
          selectionKey: "variantId",
        }}
        search={{
          enabled: true,
          keys: ["fullName", "shortName", "variantName", "sku", "category", "subcategory", "brand"],
          placeholder: "Search products, variants, or brands...",
        }}
        // Update the filters prop in EnhancedTable to include customFilters
        filters={{
          enabled: true,
          customFilters: [
            {
              key: "isFeatured",
              label: "Featured Products",
              type: "boolean",
              defaultValue: false,
            },
            {
              key: "isInOfferZone",
              label: "Offer Zone Products",
              type: "boolean",
              defaultValue: false,
            },
            {
              key: "hasMultipleVariants",
              label: "Multiple Variants",
              type: "boolean",
              defaultValue: false,
            },
          ],
        }}
        pagination={{
          enabled: true,
          pageSizeOptions: [10, 25, 50, 100],
          defaultPageSize: 25,
        }}
        sorting={{
          enabled: true,
          defaultSortColumn: "fullName",
          defaultSortDirection: "asc",
        }}
        actions={{
          onAdd: handleAddProduct,
          addButtonText: "Add New Product",
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
          zebraStriping: true,
          stickyHeader: true
        }}
        onRowClick={(row) => {
          router.push(`/product/${encodeUUID(row.productId)}/${row.slug}`);
        }}
      />
    </div>
  );
}