'use client';
import React from 'react';
import Image from 'next/image';
import { useHomeStore } from '@/store/home-store';

const OfferZoneCTA: React.FC = () => {
  const { banners } = useHomeStore();
  // Find the cta banner with status: 'active'
  const ctaBanner = banners.find((banner) => {
    const isCta = banner.type.toLowerCase() === 'cta';
    const isActive = banner.status.toLowerCase() === 'active';
    // console.log('Checking banner:', { id: banner.id, type: banner.type, status: banner.status, isCta, isActive });
    return isCta && isActive;
  });

  // Use ctaBanner.imageUrl if available, else fallback to placeholder
  const selectedImage = ctaBanner?.imageUrls.default 

  return (
    <div className="py-8 my-10 px-4 rounded-xl max-h-[300px] relative overflow-hidden">
      <img
        src={selectedImage ?? '/placeholder.svg'}
        alt={ctaBanner?.title || 'Offer Zone Banner'}
      
        className="object-cover object-right sm:object-center w-full h-full absolute inset-0"
      />
      <div className="absolute inset-0 bg-black/40   md:bg-black/20 rounded-xl z-10" />
      <div className="relative px-10 mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between z-20">
        <div className=" text-center md:text-left">
          <h2 className="text-white text-2xl md:text-4xl font-bold mb-3 nohemi-bold">
            Special <span className="text-primary-hover">Offer Zone</span>
          </h2>
          <p className="text-indigo-100 text-sm md:text-lg mb-6 max-w-xl">
            Discover exclusive deals on our premium gaming peripherals. Limited time offers on selected products.
          </p>
          <button className="bg-white text-xs md:text-base text-primary hover:bg-indigo-50 transition-colors px-8 py-3 rounded-md font-medium">
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferZoneCTA;