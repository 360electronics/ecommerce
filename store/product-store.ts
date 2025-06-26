// app/store/product-store.ts
'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { useAuthStore } from './auth-store';
import { useCartStore } from './cart-store';
import { useCheckoutStore } from './checkout-store';
import { FlattenedProduct } from '@/types/product';

interface ProductState {
  product: FlattenedProduct | null;
  selectedAttributes: Record<string, string | number | boolean>;
  quantity: number;
  selectedImageIndex: number;
  lensPosition: { x: number; y: number };
  isLoading: boolean;
  error: string | null;
  setProduct: (product: FlattenedProduct) => void;
  setSelectedAttributes: (attributes: Record<string, string | number | boolean>) => void;
  setQuantity: (quantity: number) => void;
  setSelectedImageIndex: (index: number) => void;
  setLensPosition: (position: { x: number; y: number }) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  handleAddToCart: (userId: string) => Promise<boolean>;
  handleBuyNow: (userId: string) => Promise<boolean>;
  reset: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  product: null,
  selectedAttributes: {},
  quantity: 1,
  selectedImageIndex: 0,
  lensPosition: { x: 0, y: 0 },
  isLoading: false,
  error: null,
  setProduct: (product) => {
    if (!product || !product.productParent || !product.productParent.variants.length) {
      set({
        product,
        selectedAttributes: {},
        quantity: 1,
        selectedImageIndex: 0,
        lensPosition: { x: 0, y: 0 },
        isLoading: false,
        error: null,
      });
      return;
    }

    const currentVariant = product.productParent.variants.find((v) => v.id === product.id) || product.productParent.variants[0];
    const initialAttributes = currentVariant
      ? Object.keys(currentVariant.attributes).reduce((acc, key) => {
          acc[key] = currentVariant.attributes[key];
          return acc;
        }, {} as Record<string, string | number | boolean>)
      : {};

    set({
      product,
      selectedAttributes: initialAttributes,
      quantity: 1,
      selectedImageIndex: 0,
      lensPosition: { x: 0, y: 0 },
      isLoading: false,
      error: null,
    });
  },
  setSelectedAttributes: (attributes) => set({ selectedAttributes: attributes }),
  setQuantity: (quantity) => {
    const { product, selectedAttributes } = get();
    if (!product || !product.productParent || !product.productParent.variants.length) {
      set({ quantity: Math.max(1, quantity) });
      return;
    }

    const activeVariant = product.productParent.variants.find((v) =>
      Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
    );

    if (!activeVariant) {
      set({ quantity: 1 });
      return;
    }

    const maxQuantity = activeVariant.isBackorderable ? Infinity : Number(activeVariant.stock);
    set({ quantity: Math.max(1, Math.min(quantity, maxQuantity)) });
  },
  setSelectedImageIndex: (index) => set({ selectedImageIndex: index }),
  setLensPosition: (position) => set({ lensPosition: position }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  handleAddToCart: async (userId: string) => {
    const { product, selectedAttributes, quantity } = get();
    if (!product || !product.productParent || !product.productParent.variants.length) {
      toast.error('No product selected');
      return false;
    }

    const { addToCart } = useCartStore.getState();

    const variant = product.productParent.variants.find((v) =>
      Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
    );

    if (!variant) {
      toast.error('Selected variant is not available');
      return false;
    }

    if (variant.stock <= 0) {
      toast.error('Selected variant is out of stock');
      return false;
    }

    if (Number(variant.stock) < quantity && !variant.isBackorderable) {
      toast.error(`Only ${variant.stock} items available in stock`);
      return false;
    }

    try {
      set({ isLoading: true });
      await addToCart(product.productId, variant.id, quantity);
      toast.success(`${product.name} added to cart!`);
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item to cart');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  handleBuyNow: async (userId: string) => {
    const { product, selectedAttributes, quantity } = get();
    if (!product || !product.productParent || !product.productParent.variants.length) {
      toast.error('No product selected');
      return false;
    }

    const { addToCheckout, error: checkoutError } = useCheckoutStore.getState();

    const variant = product.productParent.variants.find((v) =>
      Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
    );

    if (!variant) {
      toast.error('Selected variant is not available');
      return false;
    }

    if (variant.stock <= 0) {
      toast.error('Selected variant is out of stock');
      return false;
    }

    if (Number(variant.stock) < quantity && !variant.isBackorderable) {
      toast.error(`Only ${variant.stock} items available in stock`);
      return false;
    }

    const item = {
      userId,
      productId: product.productId,
      variantId: variant.id,
      totalPrice: variant.ourPrice * quantity,
      quantity,
    };

    try {
      set({ isLoading: true });
      await addToCheckout(item);
      if (!checkoutError) {
        return true;
      } else {
        toast.error(checkoutError || 'Failed to proceed to checkout');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to proceed to checkout');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  reset: () =>
    set({
      product: null,
      selectedAttributes: {},
      quantity: 1,
      selectedImageIndex: 0,
      lensPosition: { x: 0, y: 0 },
      isLoading: false,
      error: null,
    }),
}));