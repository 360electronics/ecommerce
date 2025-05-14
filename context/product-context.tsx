'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCart } from './cart-context';
import { useAuth } from './auth-context';
import { useCheckout } from './checkout-context';

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
  handleAddToCart: () => Promise<void>;
  handleBuyNow: () => Promise<void>;
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
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const { addToCart, error } = useCart();
  const { addToCheckout } = useCheckout();
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  const handleAddToCart = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to add items to cart');
      router.push('/login');
      return;
    }

    const variant = product.productParent.variants.find(
      (v) => v.color === selectedColor && v.storage === selectedStorage
    );

    if (!variant) {
      toast.error('Selected variant is not available');
      return;
    }

    try {
      await addToCart(product.productId, variant.id, quantity);
      if (!error) {
        toast.success(`${product.name} (${selectedColor}, ${selectedStorage}) added to cart!`);
      } else {
        toast.error(error || 'Failed to add item to cart');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to proceed with purchase');
      router.push('/login');
      return;
    }

    const item = {
      userId: user.id,
      productId: product.productId,
      variantId: product.id,
      totalPrice: product.ourPrice,
      quantity: 1
    }

    try {
      await addToCheckout(item);
      if (!error) {
        router.push('/checkout');
      } else {
        toast.error(error || 'Failed to proceed to checkout');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    }
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