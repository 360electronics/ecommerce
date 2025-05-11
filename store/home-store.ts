import { create } from 'zustand';
import { Product } from '@/types/product';
import { Banner } from '@/types/banner';

interface HomeStore {
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
  setBanners: (banners: Banner[]) => void;
  setFeaturedProducts: (products: Product[]) => void;
  setNewArrivals: (products: Product[]) => void;
  setGamersZoneProducts: (products: {
    consoles: Product[];
    accessories: Product[];
    laptops: Product[];
    'steering-chairs': Product[];
  }) => void;
  setBrandProducts: (products: Product[]) => void;
}

export const useHomeStore = create<HomeStore>((set) => ({
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
  setBanners: (banners) => set({ banners }),
  setFeaturedProducts: (products) => set({ featuredProducts: products }),
  setNewArrivals: (products) => set({ newArrivals: products }),
  setGamersZoneProducts: (products) => set({ gamersZoneProducts: products }),
  setBrandProducts: (products) => set({ brandProducts: products }),
}));