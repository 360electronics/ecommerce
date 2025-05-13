'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface FlattenedProduct {
  id: string;
  productId: string;
  name: string;
  mrp: number;
  ourPrice: number;
  averageRating: string;
  brand: string;
  category: string;
  color: string;
  createdAt: string;
  description: string | null;
  dimensions: string;
  material: string;
  productImages: string[];
  productParent: {
    averageRating: string;
    brand: string;
    category: string;
    createdAt: string;
    description: string | null;
    id: string;
    ratingCount: string;
    shortName: string;
    specifications: Array<{
      groupName: string;
      fields: Array<{ fieldName: string; fieldValue: string }>;
    }>;
    status: string;
    subProductStatus: string;
    tags: string[];
    totalStocks: string;
    updatedAt: string;
    variants: Array<{
      id: string;
      color: string;
      storage: string;
      slug: string;
      mrp: number;
      ourPrice: number;
      stock: string;
    }>;
  };
  sku: string;
  slug: string;
  stock: string;
  storage: string;
  tags: string[];
  totalStocks: string;
  updatedAt: string;
  weight: string;
  deliveryDate?: string;
  discount?: number;
}

interface ProductContextType {
  product: FlattenedProduct;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedStorage: string;
  setSelectedStorage: (storage: string) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
  lensPosition: { x: number; y: number };
  setLensPosition: (position: { x: number; y: number }) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({
  product,
  children,
}: {
  product: FlattenedProduct;
  children: ReactNode;
}) {
  const [selectedColor, setSelectedColor] = useState(product.color || '');
  const [selectedStorage, setSelectedStorage] = useState(product.storage || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Change this to store percentages instead of pixel values
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });

  const handleAddToCart = () => {
    const variant = product.productParent.variants.find(
      (v) => v.color === selectedColor && v.storage === selectedStorage
    );
    console.log('Add to cart:', {
      productId: product.id,
      variantId: variant?.id,
      quantity,
    });
  };

  const handleBuyNow = () => {
    const variant = product.productParent.variants.find(
      (v) => v.color === selectedColor && v.storage === selectedStorage
    );
    console.log('Buy now:', {
      productId: product.id,
      variantId: variant?.id,
      quantity,
    });
  };

  return (
    <ProductContext.Provider
      value={{
        product,
        selectedColor,
        setSelectedColor,
        selectedStorage,
        setSelectedStorage,
        quantity,
        setQuantity,
        selectedImageIndex,
        setSelectedImageIndex,
        lensPosition,
        setLensPosition,
        handleAddToCart,
        handleBuyNow,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
}