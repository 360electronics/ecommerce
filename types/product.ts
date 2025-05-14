// types/product.ts (add to existing file)
export interface Variant {
  id: string;
  productId: string; // Added missing productId
  name: string;
  sku: string;
  slug: string;
  color: string;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  mrp: string;
  ourPrice: string;
  storage: string | null;
  stock: string;
  productImages: string[];
  createdAt: string; // Added missing fields
  updatedAt: string;
}

export interface Specification {
  groupName: string;
  fields: { fieldName: string; fieldValue: string }[];
}

export interface Product {
  id: string;
  shortName: string;
  brand: string;
  category: string;
  description: string | null;
  status: 'active' | 'inactive';
  subProductStatus: 'active' | 'inactive';
  deliveryMode: 'standard' | 'express';
  tags: string | null;
  totalStocks: string;
  averageRating: string;
  ratingCount: string;
  createdAt: string;
  updatedAt: string;
  specifications: Specification[];
  variants: Variant[];
  discount?: number;
}

export interface DisplayVariant extends Variant {
  productId: string;
  brand: string;
  category: string;
  averageRating: string;
  tags: string | null; // Changed to allow null
  createdAt: string;
}
export interface FeaturedProduct {
    id: string;
    productId: number;
    createdAt: string;
    updatedAt: string;
  }
  
export interface ProductCardProps {
  image?: string
  name: string
  rating?: number
  ourPrice: number
  mrp?: number
  discount?: number
  showViewDetails?: boolean
  className?: string
  slug?: string
  onRemove?: () => void
  onAddToCart?: boolean
  isHeartNeed?: boolean
  productId: string;
  variantId: string;
}


// Define interfaces
interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  mrp: string;
  ourPrice: string;
  color?: string;
  storage?: string;
  stock: string;
  slug: string;
  productImages?: string[];
  sku: string;
  dimensions?: string;
  material?: string;
  weight?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductType {
  id: string;
  averageRating: string;
  brand?: string;
  category: string;
  description?: string | null;
  shortName?: string;
  status: string;
  subProductStatus?: string;
  tags?: string | string[];
  totalStocks: string;
  ratingCount?: string;
  specifications?: any[];
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
}

export interface FlattenedProduct extends ProductVariant {
  category: string;
  brand?: string;
  averageRating: string;
  totalStocks: string;
  tags: string[]; // Normalized to string[]
  description?: string | null;
  productParent?: ProductType;
}
