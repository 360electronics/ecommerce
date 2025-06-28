'use client';

import { create } from 'zustand';
import { fetchWithRetry, logError, AppError } from './store-utils';
import { Banner } from '@/types/banner';
import { Product } from './types';

interface HomeState {
  banners: Banner[];
  featuredProducts: Product[];
  newArrivals: Product[];
  gamersZoneProducts: {
    consoles: Product[];
    accessories: Product[];
    laptops: Product[];
    'steering-chairs': Product[];
  };
  brandProducts: Product[];
  isLoading: boolean;
  error: AppError | null;
  lastFetched: number | null;
  fetchHomeData: (force?: boolean) => Promise<void>;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  banners: [],
  featuredProducts: [],
  newArrivals: [],
  gamersZoneProducts: { consoles: [], accessories: [], laptops: [], 'steering-chairs': [] },
  brandProducts: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  fetchHomeData: async (force = false) => {
    const cacheDuration = 15 * 60 * 1000; // 15 minutes
    const lastFetched = get().lastFetched;
    if (lastFetched && Date.now() - lastFetched < cacheDuration) return;

    try {
      set({ isLoading: true, error: null });
      const startTime = performance.now();
      const [bannerResponse, featuredProducts, newArrivals, gamersZoneProducts, brandProducts] = await Promise.all([
        fetchWithRetry<{ data: Banner[] }>(() => fetch('/api/banner')).then((data) => {
          console.log(`[fetchBanners] Duration: ${performance.now() - startTime}ms`);
          return Array.isArray(data?.data) ? data.data : [];
        }),
        fetchWithRetry<Product[]>(() => fetch('/api/products/offer-zone')).then((data) =>
          Array.isArray(data) ? data : []
        ),
        fetchWithRetry<Product[]>(() => fetch('/api/products/new-arrivals')).then((data) =>
          Array.isArray(data) ? data : []
        ),
        fetchWithRetry<{
          consoles: Product[];
          accessories: Product[];
          laptops: Product[];
          'steering-chairs': Product[];
        }>(() => fetch('/api/products/gamers-zone')).then((data) =>
          data && typeof data === 'object'
            ? {
                consoles: Array.isArray(data.consoles) ? data.consoles : [],
                accessories: Array.isArray(data.accessories) ? data.accessories : [],
                laptops: Array.isArray(data.laptops) ? data.laptops : [],
                'steering-chairs': Array.isArray(data['steering-chairs']) ? data['steering-chairs'] : [],
              }
            : { consoles: [], accessories: [], laptops: [], 'steering-chairs': [] }
        ),
        fetchWithRetry<Product[]>(() => fetch('/api/products')).then((data) =>
          Array.isArray(data) ? data : []
        ),
      ]);

      set({
        banners: bannerResponse,
        featuredProducts,
        newArrivals,
        gamersZoneProducts,
        brandProducts,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      logError('fetchHomeData', error);
      set({ error: error as AppError, isLoading: false });
    }
  },
}));