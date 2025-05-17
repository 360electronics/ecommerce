'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './auth-store';
import { useCartStore } from './cart-store'; // Hypothetical Zustand store
import { useCheckoutStore } from './checkout-store';
import { FlattenedProduct } from './types';

interface ProductState {
  product: FlattenedProduct | null;
  selectedColor: string;
  selectedStorage: string;
  quantity: number;
  selectedImageIndex: number;
  lensPosition: { x: number; y: number };
  isLoading: boolean;
  error: string | null;
  setProduct: (product: FlattenedProduct) => void;
  setSelectedColor: (color: string) => void;
  setSelectedStorage: (storage: string) => void;
  setQuantity: (quantity: number) => void;
  setSelectedImageIndex: (index: number) => void;
  setLensPosition: (position: { x: number; y: number }) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  handleAddToCart: () => Promise<void>;
  handleBuyNow: () => Promise<void>;
  reset: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      product: null,
      selectedColor: '',
      selectedStorage: '',
      quantity: 1,
      selectedImageIndex: 0,
      lensPosition: { x: 0, y: 0 },
      isLoading: false,
      error: null,
      setProduct: (product) =>
        set({
          product,
          selectedColor: product.color || '',
          selectedStorage: product.storage || '',
          quantity: 1,
          selectedImageIndex: 0,
          lensPosition: { x: 0, y: 0 },
          isLoading: false,
          error: null,
        }),
      setSelectedColor: (color) => set({ selectedColor: color }),
      setSelectedStorage: (storage) => set({ selectedStorage: storage }),
      setQuantity: (quantity) => set({ quantity: Math.max(1, quantity) }), // Prevent negative quantities
      setSelectedImageIndex: (index) => set({ selectedImageIndex: index }),
      setLensPosition: (position) => set({ lensPosition: position }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      handleAddToCart: async () => {
        const { product, selectedColor, selectedStorage, quantity } = get();
        if (!product) {
          toast.error('No product selected');
          return;
        }

        const { addToCart } = useCartStore.getState();
        const { isLoggedIn, user } = useAuthStore.getState();
        const router = useRouter();

        if (!isLoggedIn || !user?.id) {
          toast.error('Please log in to add items to cart');
          router.push('/login');
          return;
        }

        const variant = product.productParent.variants.find(
          (v: { color: string; storage: string; }) => v.color === selectedColor && v.storage === selectedStorage
        );

        if (!variant) {
          toast.error('Selected variant is not available');
          return;
        }

        try {
          await addToCart(product.productId, variant.id, quantity);
          toast.success(`${product.name} (${selectedColor}, ${selectedStorage}) added to cart!`);
        } catch (err) {
          toast.error('An unexpected error occurred');
        }
      },
      handleBuyNow: async () => {
        const { product, selectedColor, selectedStorage } = get();
        if (!product) {
          toast.error('No product selected');
          return;
        }

        const { addToCheckout, error: checkoutError } = useCheckoutStore.getState();
        const { isLoggedIn, user } = useAuthStore.getState();
        const router = useRouter();

        if (!isLoggedIn || !user?.id) {
          toast.error('Please log in to proceed with purchase');
          router.push('/login');
          return;
        }

        const variant = product.productParent.variants.find(
          (v: { color: string; storage: string; }) => v.color === selectedColor && v.storage === selectedStorage
        );

        if (!variant) {
          toast.error('Selected variant is not available');
          return;
        }

        const item = {
          userId: user.id,
          productId: product.productId,
          variantId: variant.id,
          totalPrice: variant.ourPrice, // Use variant price for accuracy
          quantity: 1,
        };

        try {
          await addToCheckout(item);
          if (!checkoutError) {
            router.push('/checkout');
          } else {
            toast.error(checkoutError || 'Failed to proceed to checkout');
          }
        } catch (err) {
          toast.error('An unexpected error occurred');
        }
      },
      reset: () =>
        set({
          product: null,
          selectedColor: '',
          selectedStorage: '',
          quantity: 1,
          selectedImageIndex: 0,
          lensPosition: { x: 0, y: 0 },
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'product-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedColor: state.selectedColor,
        selectedStorage: state.selectedStorage,
        quantity: state.quantity,
        selectedImageIndex: state.selectedImageIndex,
        lensPosition: state.lensPosition,
      }),
    }
  )
);