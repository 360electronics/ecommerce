export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string;
    mrp?: number;
    ourPrice:string ;
    status: 'active' | 'inactive';
    subProductStatus: 'active' | 'inactive';
    totalStocks: number;
    deliveryMode: 'standard' | 'express';
    productImages: string[];
    sku: string;
    averageRating: number;
    ratingCount: number;
    createdAt: Date;
    updatedAt: Date;
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
    onRemove?: () => void 
    isHeartNeed?: boolean
  }