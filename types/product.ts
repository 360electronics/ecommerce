export interface Product {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  brand: string;
  color: string;
  material: string;
  dimensions: string;
  weight: string;
  storage: string;
  tags: string | string[];
  mrp:  number;
  ourPrice:  number;
  deliveryMode: string;
  sku: string;
  status: string;
  subProductStatus: string;
  totalStocks: number;
  productImages: (string | null)[];
  averageRating?: string | number;
  ratingCount?: string | number;
  specifications?: Array<{
    groupName: string;
    fields: Array<{
      fieldName: string;
      fieldValue: string;
    }>;
  }> | boolean;
  discount?: number;
  isSelected?: boolean;
  shortDescription?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
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
  isHeartNeed?: boolean
}