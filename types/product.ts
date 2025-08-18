import { reviews } from './../db/schema/products/products.schema';
// Core Entity Types
export type Category = {
  attributes: any;
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

export interface Attribute {
  name: string | null;
  type: 'text' | 'number' | 'boolean' | 'select' | null;
  options?: string[] | null;
  unit?: string | null;
  isFilterable: boolean | null;
  isRequired: boolean | null;
  displayOrder: number | null;
}

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

// Product Image Type
export type ProductImage = {
  length: number;
  url: string;
  alt: string;
  isFeatured: boolean;
  displayOrder: number;
};

// Product Dimensions Type
export type ProductDimensions = {
  length: number;
  width: number;
  height: number;
  unit: string;
};

// Product Specification Type
export type ProductSpecification = {
  groupName: string;
  fields: Array<{
    fieldName: string;
    fieldValue: string;
  }>;
};

export interface ReviewImage {
  url: string;
  alt: string;
  displayOrder: number;
}

// Review Type with User Information
export interface Review {
  id: string;
  productId: string;
  variantId?: string;
  userId: string;
  rating: string; // Stored as string in DB (e.g., "4.5")
  title?: string;
  comment?: string;
  images?: ReviewImage[];
  isApproved: boolean;
  helpfulVotes: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
}

// Variant Type with Complete Information
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
  discountPercentage: number | null;
  isLowStock: boolean;
  deliveryMode?: any;
};

// Promotion Type
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

// Related Product Summary Type
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

// Main Combined Product Type
export type CompleteProduct = {
  productImages: never[];
  // Basic product information
  id: string;
  shortName: string;
  fullName: string;
  slug: string;
  description: string | null;
  
  // Category, Subcategory and Brand information
  category: Category;
  subcategory: Subcategory | null;
  brand: Brand;
  
  // Product status and inventory
  status: 'active' | 'inactive' | 'coming_soon' | 'discontinued';
  isFeatured: boolean;
  totalStocks: number;
  deliveryMode: 'standard' | 'express' | 'same_day' | 'pickup';
  
  // Metadata
  tags: string[];
  attributes: Record<string, string | number | boolean>;
  specifications: ProductSpecification[];
  warranty: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  
  // Ratings
  averageRating: number;
  ratingCount: number;
  
  // Variants
  variants: ProductVariant[];
  defaultVariant: ProductVariant;
  
  // Related information
  relatedProducts: Array<{
    relationType: 'similar' | 'accessory' | 'replacement' | 'bundle' | 'upsell';
    displayOrder: number;
    product: RelatedProductSummary;
  }>;
  
  // Compatibility
  compatibleWith: Array<{
    product: RelatedProductSummary;
    compatibilityNote: string | null;
  }>;
  
  // Reviews
  reviews: Review[];
  
  // Special zones and promotions
  isInOfferZone: boolean;
  isNewArrival: boolean;
  isInGamersZone: boolean;
  gamersZoneCategory?: 'laptops' | 'desktops' | 'accessories' | 'consoles';
  
  // Active promotions
  activePromotions: Array<{
    promotion: ProductPromotion;
    applicableEntityType: 'product' | 'variant' | 'category' | 'subcategory' | 'brand';
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Utility computed properties
  hasMultipleVariants: boolean;
  priceRange: {
    min: number;
    max: number;
  } | null;
  allImages: ProductImage[];
  isDiscontinued: boolean;
  isComingSoon: boolean;
};

export interface RatingDistribution {
  value: number;
  count: number;
}



export interface FlattenedProduct {
  attributes: any;
  id: string;
  productId: string;
  name: string;
  mrp: string;
  ourPrice: string;
  color?: string;
  storage?: string;
  stock: string;
  slug: string;
  productImages?: ProductImage;
  sku: string;
  reviews?: Review[];
  ratingDistribution: RatingDistribution[]; // Add this
  ratingCount?: number; // Add this
  dimensions?: string;
  material?: string;
  weight?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  category: Category;
  subcategory: Subcategory;
  brand?: { id: string; name: string; slug: string };
  averageRating: string;
  totalStocks: string;
  tags: string[];
  description?: string | null;
  productParent?: CompleteProduct;

}