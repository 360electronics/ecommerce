// app/store/home-store.ts
'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';
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
  error: string | null;
  hasLoadedOnce: boolean;
  fetchHomeData: () => Promise<void>;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  banners: [],
  featuredProducts: [],
  newArrivals: [],
  gamersZoneProducts: {
    consoles: [],
    accessories: [],
    laptops: [],
    'steering-chairs': [],
  },
  brandProducts: [],
  isLoading: false,
  error: null,
  hasLoadedOnce: false,
  fetchHomeData: async () => {
    if (get().hasLoadedOnce) {
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const [bannersRes, featuredRes, newArrivalsRes, gamersZoneRes, brandProductsRes] = await Promise.all([
        fetch('/api/banner'),
        fetch('/api/products/offer-zone'),
        fetch('/api/products/new-arrivals'),
        fetch('/api/products/gamers-zone'),
        fetch('/api/products'),
      ]);

      if (!bannersRes.ok) throw new Error('Failed to fetch banners');
      if (!featuredRes.ok) throw new Error('Failed to fetch featured products');
      if (!newArrivalsRes.ok) throw new Error('Failed to fetch new arrivals');
      if (!gamersZoneRes.ok) throw new Error('Failed to fetch gamers zone products');
      if (!brandProductsRes.ok) throw new Error('Failed to fetch brand products');

      const [banners, featuredProducts, newArrivals, gamersZoneProducts, brandProducts] = await Promise.all([
        bannersRes.json(),
        featuredRes.json(),
        newArrivalsRes.json(),
        gamersZoneRes.json(),
        brandProductsRes.json(),
      ]);

      const safeBanners = Array.isArray(banners?.data) ? banners.data : [];
      const safeFeaturedProducts = Array.isArray(featuredProducts) ? featuredProducts : [];
      const safeNewArrivals = Array.isArray(newArrivals) ? newArrivals : [];
      const safeGamersZoneProducts = gamersZoneProducts && typeof gamersZoneProducts === 'object' ? {
        consoles: Array.isArray(gamersZoneProducts.consoles) ? gamersZoneProducts.consoles : [],
        accessories: Array.isArray(gamersZoneProducts.accessories) ? gamersZoneProducts.accessories : [],
        laptops: Array.isArray(gamersZoneProducts.laptops) ? gamersZoneProducts.laptops : [],
        'steering-chairs': Array.isArray(gamersZoneProducts['steering-chairs']) ? gamersZoneProducts['steering-chairs'] : [],
      } : {
        consoles: [],
        accessories: [],
        laptops: [],
        'steering-chairs': [],
      };
      const safeBrandProducts = Array.isArray(brandProducts) ? brandProducts : [];

      set({
        banners: safeBanners,
        featuredProducts: safeFeaturedProducts,
        newArrivals: safeNewArrivals,
        gamersZoneProducts: safeGamersZoneProducts,
        brandProducts: safeBrandProducts,
        isLoading: false,
        hasLoadedOnce: true,
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
      set({ error: 'Failed to load home data', isLoading: false });
      toast.error('Failed to load home data');
    }
  },
}));