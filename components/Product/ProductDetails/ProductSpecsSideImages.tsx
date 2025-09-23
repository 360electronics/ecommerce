'use client';

import { fetchBannersServer } from '@/utils/banners.utils';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

interface Banner {
  id: string;
  title: string;
  type: string;
  imageUrls: {
    sm?: string;
    default: string;
  };
}

const ProductSpecsSideImages = () => {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await fetchBannersServer();
        if (data) {
          // Filter banners of type 'promotional'
          const sideBanners = data.data.filter((b: Banner) => b.type === 'promotional');
          setBanners(sideBanners);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      }
    };

    fetchBanners();
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className='flex-col items-center justify-start my-36 gap-10 sticky inset-0 hidden md:flex top-32'>
      {banners.map((banner) => (
        <div key={banner.id}>
          <img
            src={banner.imageUrls.default}
            alt={banner.title}
            width={300}
            height={450}
            className='rounded-lg w-full h-full'
          />
        </div>
      ))}
    </div>
  );
};

export default ProductSpecsSideImages;
