// components/Home/Hero/HeroBanner.tsx
"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Image from "next/image";
import PrimaryLinkButton from "@/components/Reusable/PrimaryLinkButton";
import { Volume2, VolumeOff, AlertCircle } from "lucide-react";
import { useHomeStore } from "@/store/home-store";
import { cn } from "@/lib/utils";

// Types (aligned with banners schema)
interface ImageUrls {
  default: string;
  sm?: string;
  lg?: string;
}

interface Banner {
  id: string;
  title: string;
  type: string;
  imageUrls: ImageUrls;
  start_date?: string;
  end_date?: string;
  status: "active" | "inactive";
  createdAt: string | Date;
  updatedAt: string | Date;
}

const HeroBanner: React.FC = () => {
  const { banners, error } = useHomeStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mainBanners, setMainBanners] = useState<Banner[]>([]);
  const [secondaryBanner, setSecondaryBanner] = useState<Banner | null>(null);
  const [customisePC, setCustomisePC] = useState<Banner | null>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const [isMainMuted, setIsMainMuted] = useState(true);
  const [isSecondaryMuted, setIsSecondaryMuted] = useState(true);

  // Normalize banner data
  const normalizeBanner = useCallback((banner: any): Banner | null => {
    if (!banner || typeof banner !== "object") return null;
    return {
      id: banner.id || "",
      title: banner.title || "",
      type: banner.type || "",
      imageUrls:
        banner.imageUrls && typeof banner.imageUrls === "object"
          ? {
              default: banner.imageUrls.default || "/placeholder.svg",
              sm: banner.imageUrls.sm,
              lg: banner.imageUrls.lg,
            }
          : { default: "/placeholder.svg" },
      start_date: banner.start_date,
      end_date: banner.end_date,
      status:
        banner.status === "active" || banner.status === "inactive"
          ? banner.status
          : "inactive",
      createdAt: banner.createdAt || new Date(),
      updatedAt: banner.updatedAt || new Date(),
    };
  }, []);

  // Update banners
  useEffect(() => {
    if (!banners || !Array.isArray(banners)) {
      console.warn("[BANNERS_ERROR] Invalid banners data:", banners);
      setMainBanners([]);
      setSecondaryBanner(null);
      setCustomisePC(null);
      return;
    }

    const normalizedBanners = banners
      .map(normalizeBanner)
      .filter((banner): banner is Banner => banner !== null);

    const filteredMainBanners = normalizedBanners.filter(
      (banner) => banner.type === "hero-main" && banner.status === "active"
    );
    const secondary =
      normalizedBanners.find(
        (banner) =>
          banner.type === "hero-secondary" && banner.status === "active"
      ) || null;
    const customise =
      normalizedBanners.find(
        (banner) => banner.type === "customise-pc" && banner.status === "active"
      ) || null;

    setMainBanners(filteredMainBanners);
    setSecondaryBanner(secondary);
    setCustomisePC(customise);

    console.debug("[BANNERS_NORMALIZED]", {
      mainBanners: filteredMainBanners,
      secondary,
      customise,
    });
  }, [banners, normalizeBanner]);

  // Auto-play main video
  useEffect(() => {
    if (
      mainVideoRef.current &&
      isVideoUrl(mainBanners[currentImageIndex]?.imageUrls.default)
    ) {
      mainVideoRef.current.play().catch((err) => {
        console.error("[MAIN_VIDEO_ERROR] Failed to play video:", err);
      });
    }
  }, [currentImageIndex, mainBanners]);

  // Carousel interval
  useEffect(() => {
    if (mainBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === mainBanners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [mainBanners]);

  const isVideoUrl = useCallback((url: string | undefined): boolean => {
    if (!url) return false;
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  }, []);

  const toggleMainMute = useCallback(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.muted = !mainVideoRef.current.muted;
      setIsMainMuted(mainVideoRef.current.muted);
    }
  }, []);

  const toggleSecondaryMute = useCallback(() => {
    if (secondaryVideoRef.current) {
      secondaryVideoRef.current.muted = !secondaryVideoRef.current.muted;
      setIsSecondaryMuted(secondaryVideoRef.current.muted);
    }
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  const goToPrevSlide = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? mainBanners.length - 1 : prevIndex - 1
    );
  }, [mainBanners]);

  const goToNextSlide = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === mainBanners.length - 1 ? 0 : prevIndex + 1
    );
  }, [mainBanners]);

  const getResponsiveImageUrl = useCallback(
    (imageUrls: ImageUrls | undefined): string => {
      if (!imageUrls) return "/placeholder_banner.png";
      const width = typeof window !== "undefined" ? window.innerWidth : 0;
      return (
        (width >= 1024 && imageUrls.lg) ||
        (width <= 640 && imageUrls.sm) ||
        imageUrls.default
      );
    },
    []
  );

  if (error) {
    return (
      <div className="w-full flex items-center justify-center h-[70dvh]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-red-600">
            {error?.message || "Failed to load banners"}
          </p>
          <PrimaryLinkButton href="/category/all">
            Browse All Products
          </PrimaryLinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 items-center justify-center p-0">
      <div className="relative w-full h-[70dvh]">
        <div className="absolute w-full h-[70dvh] rounded-xl overflow-hidden">
          {mainBanners.length > 0 ? (
            <div className="relative w-full h-full">
              {isVideoUrl(mainBanners[currentImageIndex]?.imageUrls.default) ? (
                <video
                  ref={mainVideoRef}
                  src={getResponsiveImageUrl(
                    mainBanners[currentImageIndex]?.imageUrls
                  )}
                  autoPlay
                  loop
                  muted={isMainMuted}
                  playsInline
                  className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
                  aria-label={
                    mainBanners[currentImageIndex]?.title ||
                    `Banner ${currentImageIndex + 1}`
                  }
                  title={mainBanners[currentImageIndex]?.title}
                  onError={(e) =>
                    console.error(
                      "[MAIN_VIDEO_ERROR] Failed to load video:",
                      mainBanners[currentImageIndex]?.imageUrls
                    )
                  }
                />
              ) : (
                <img
                  
                  src={
                    getResponsiveImageUrl(
                      mainBanners[currentImageIndex]?.imageUrls
                    ) || "/placeholder.svg"
                  }
                  alt={
                    mainBanners[currentImageIndex]?.title ||
                    `Banner ${currentImageIndex + 1}`
                  }
                  className=" aspect-[3/4.5] md:aspect-auto object-cover object-center transition-opacity duration-500 ease-in-out"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-between px-6">
                <button
                  onClick={goToPrevSlide}
                  className="bg-primary cursor-pointer hover:bg-opacity-60 text-white p-3 rounded-full transition-all duration-300"
                  aria-label="Previous slide"
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={goToNextSlide}
                  className="bg-primary cursor-pointer bg-opacity-40 hover:bg-opacity-60 text-white p-3 rounded-full transition-all duration-300"
                  aria-label="Next slide"
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
              {isVideoUrl(
                mainBanners[currentImageIndex]?.imageUrls.default
              ) && (
                <button
                  onClick={toggleMainMute}
                  className="absolute bottom-12 right-3 bg-white text-gray-800 p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-all"
                  aria-label={
                    isMainMuted ? "Unmute main video" : "Mute main video"
                  }
                >
                  {isMainMuted ? (
                    <VolumeOff className="size-4" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
              )}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-3">
                {mainBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      currentImageIndex === index
                        ? "bg-white scale-125"
                        : "bg-gray-100"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl">
              <img
                src="/placeholder_banner.png"
                alt="Default banner"
                className="object-cover"
              />
            </div>
          )}
          <div className="absolute bottom-[30%] w-6 h-6 rounded-full shadow-[-12px_12px_0_#fff] z-0" />
          <div className="absolute bottom-0 left-[30%] md:left-[20%] w-6 h-6 rounded-full shadow-[-12px_12px_0_#fff] z-0" />
        </div>
        <div className="absolute left-0 bottom-0 w-[30%] md:w-[20%] h-[30%] border-t-[12px] border-r-[12px] border-white rounded-tr-2xl rounded-bl-2xl overflow-hidden">
          {secondaryBanner ? (
            <div className="relative w-full h-full">
              {isVideoUrl(secondaryBanner.imageUrls.default) ? (
                <video
                  ref={secondaryVideoRef}
                  src={getResponsiveImageUrl(secondaryBanner.imageUrls)}
                  autoPlay
                  loop
                  muted={isSecondaryMuted}
                  playsInline
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  preload="metadata"
                  aria-label={secondaryBanner.title || "Secondary banner video"}
                  onError={(e) =>
                    console.error(
                      "[SECONDARY_VIDEO_ERROR] Failed to load video:",
                      secondaryBanner.imageUrls
                    )
                  }
                />
              ) : (
                <img
                  src={
                    getResponsiveImageUrl(secondaryBanner.imageUrls) ||
                    "/placeholder.svg"
                  }
                  alt={secondaryBanner.title || "Secondary banner"}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              )}
              {isVideoUrl(secondaryBanner.imageUrls.default) && (
                <button
                  onClick={toggleSecondaryMute}
                  className="absolute bottom-3 right-3 bg-white text-gray-800 p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-all"
                  aria-label={
                    isSecondaryMuted
                      ? "Unmute secondary video"
                      : "Mute secondary video"
                  }
                >
                  {isSecondaryMuted ? (
                    <VolumeOff className="size-4" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <img
              src="/placeholder_banner.png"
              alt="Default secondary banner"
              className="object-cover"
            />
          )}
          <div className="absolute top-0 left-0 w-6 h-6 rounded-full shadow-[-12px_-12px_0_#fff] z-40" />
          <div className="absolute top-0 right-0 w-6 h-6 rounded-full shadow-[12px_-12px_0_#fff] z-40" />
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full shadow-[12px_12px_0_#fff] z-40" />
        </div>
      </div>
      <div className="w-full h-[30dvh] sm:h-[25dvh] md:h-[20dvh] rounded-xl relative overflow-hidden">
        {customisePC ? (
          <div className="absolute inset-0 bg-cover bg-center z-0">
            <img
              src={getResponsiveImageUrl(customisePC.imageUrls)}
              alt={customisePC.title || "Customize your PC"}
              className="object-cover w-full h-full"
              style={{ filter: "brightness(0.7)" }}
              loading="lazy"
            />
            <div className="relative z-10 h-full flex flex-col md:flex-row items-start md:items-center justify-end md:justify-between px-4 sm:px-6 md:px-8 py-4 gap-3 md:gap-0">
              <div className="text-white max-w-xl">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 nohemi-bold">
                  Customize Your <span className="text-primary">Own PC</span>
                </h2>
                <p className="text-xs sm:text-sm md:text-base opacity-90 mb-2">
                  Build your dream gaming rig with premium components and expert
                  assembly.
                </p>
              </div>
              <PrimaryLinkButton href="/customise-pc">
                Start Building
              </PrimaryLinkButton>
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/customise.png')",
            }}
          >
            <div className="relative z-10 h-full flex flex-col md:flex-row items-start md:items-center justify-end md:justify-between px-4 sm:px-6 md:px-8 py-4 gap-3 md:gap-0">
              <div className="text-white max-w-xl">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 nohemi-bold">
                  Customize Your <span className="text-primary">Own PC</span>
                </h2>
                <p className="text-xs sm:text-sm md:text-base opacity-90 mb-2">
                  Build your dream gaming rig with premium components and expert
                  assembly.
                </p>
              </div>
              <PrimaryLinkButton href="/customise-pc">
                Start Building
              </PrimaryLinkButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(HeroBanner);
