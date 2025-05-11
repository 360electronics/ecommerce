// components/Home/Hero/HeroBanner.tsx
'use client';
import { useState, useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { Volume2, VolumeOff } from 'lucide-react';
import { useHomeStore } from '@/store/home-store';
import { Banner } from '@/types/banner';

const HeroBanner: React.FC = () => {
  const { banners } = useHomeStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mainBanners, setMainBanners] = useState<Banner[]>([]);
  const [secondaryBanner] = useState<Banner | null>(
    banners.find((banner) => banner.type === 'hero-secondary' && banner.status === 'active') || null
  );
  const [customisePC] = useState<Banner | null>(
    banners.find((banner) => banner.type === 'customise-pc' && banner.status === 'active') || null
  );
  const [isLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Update mainBanners when banners change
  useEffect(() => {
    const filteredBanners = banners.filter((banner) => {
      const isHeroMain = banner.type === 'hero-main';
      const isActive = banner.status === 'active'; 
      return isHeroMain && isActive;
    });
    setMainBanners(filteredBanners);
  }, [banners]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedIndex = localStorage.getItem('heroBannerIndex');
      setCurrentImageIndex(Number(storedIndex) || 0);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('heroBannerIndex', currentImageIndex.toString());
    }
  }, [currentImageIndex]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  useEffect(() => {
    if (mainBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === mainBanners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [mainBanners]);

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  const goToPrevSlide = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? mainBanners.length - 1 : prevIndex - 1
    );
  };

  const goToNextSlide = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === mainBanners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const isVideoUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  };

  return (
    <div className="w-full flex flex-col gap-4 items-center justify-center p-0">
      <div className="relative w-full h-[70dvh]">
        {isLoading ? (
          <div
            className="absolute w-full h-[70dvh] rounded-xl overflow-hidden bg-gray-200 animate-pulse"
            aria-hidden="true"
          ></div>
        ) : (
          <div className="absolute w-full h-[70dvh] rounded-xl overflow-hidden">
            {mainBanners.length > 0 ? (
              <div className="relative w-full h-full">
                {isVideoUrl(mainBanners[currentImageIndex]?.imageUrl) ? (
                  <video
                    src={mainBanners[currentImageIndex]?.imageUrl}
                    autoPlay={false}
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
                    aria-label={`Banner ${mainBanners[currentImageIndex]?.title}`}
                    title={mainBanners[currentImageIndex]?.title}
                  />
                ) : (
                  <Image
                    src={mainBanners[currentImageIndex]?.imageUrl || '/placeholder.jpg'}
                    alt={mainBanners[currentImageIndex]?.title || `Banner ${currentImageIndex + 1}`}
                    fill
                    className="object-cover transition-opacity duration-500 ease-in-out"
                    priority={currentImageIndex === 0}
                    quality={85}
                    onError={() => console.error('Failed to load image:', mainBanners[currentImageIndex]?.imageUrl)}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-between px-6">
                  <button
                    onClick={goToPrevSlide}
                    className="bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-3 rounded-full transition-all duration-300"
                    aria-label="Previous slide"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNextSlide}
                    className="bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-3 rounded-full transition-all duration-300"
                    aria-label="Next slide"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-3">
                  {mainBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        currentImageIndex === index ? 'bg-white scale-125' : 'bg-white bg-opacity-50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl">
                <p className="text-gray-500 text-lg">No hero-main banners available</p>
              </div>
            )}
            <div className="absolute bottom-[30%] w-6 h-6 rounded-full shadow-[-12px_12px_0_#fff] z-50" />
            <div className="absolute bottom-0 left-[30%] md:left-[20%] w-6 h-6 rounded-full shadow-[-12px_12px_0_#fff] z-50" />
          </div>
        )}
        <div className="absolute left-0 bottom-0 w-[30%] md:w-[20%] h-[30%] border-t-[12px] border-r-[12px] border-white rounded-tr-2xl rounded-bl-2xl overflow-hidden">
          {isLoading ? (
            <div className="relative w-full h-full bg-gray-200 animate-pulse" aria-hidden="true"></div>
          ) : (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={secondaryBanner?.imageUrl || '/lap.mp4'}
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
                preload="metadata"
                aria-label={secondaryBanner?.title || 'Secondary banner video'}
              />
              <button
                onClick={toggleMute}
                className="absolute bottom-3 right-3 bg-white text-gray-800 p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-all"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeOff className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>
          )}
          <div className="absolute top-0 left-0 w-6 h-6 rounded-full shadow-[-12px_-12px_0_#fff] z-40" />
          <div className="absolute top-0 right-0 w-6 h-6 rounded-full shadow-[12px_-12px_0_#fff] z-40" />
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full shadow-[12px_12px_0_#fff] z-40" />
        </div>
      </div>
      <div className="w-full h-[30dvh] sm:h-[25dvh] md:h-[20dvh] rounded-xl relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" aria-hidden="true"></div>
        ) : (
          <div className="absolute inset-0 bg-cover bg-center z-0">
            {customisePC?.imageUrl ? (
              <Image
                src={customisePC.imageUrl}
                alt={customisePC.title || 'Customize your PC'}
                fill
                className="object-cover"
                style={{ filter: 'brightness(0.7)' }}
                quality={85}
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/customise.png')",
                  filter: 'brightness(0.7)',
                }}
              ></div>
            )}
            <div className="relative z-10 h-full flex flex-col md:flex-row items-start md:items-center justify-center md:justify-between px-4 sm:px-6 md:px-8 py-4 gap-3 md:gap-0">
              <div className="text-white max-w-xl">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 nohemi-bold">
                  Customize Your <span className="text-primary">Own PC</span>
                </h2>
                <p className="text-xs sm:text-sm md:text-base opacity-90 mb-2">
                  Build your dream gaming rig with premium components and expert assembly.
                </p>
              </div>
              <PrimaryLinkButton href={'/'}>Start Building</PrimaryLinkButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(HeroBanner);