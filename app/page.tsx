'use client'
import { useState, useEffect, useRef } from 'react';
import UserLayout from "@/components/Layouts/UserLayout";
import Image from "next/image";
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { Mic, MicOff, Volume, Volume2, VolumeOff } from 'lucide-react';

const Promo_Banners_Main = [
  {
    img: '/zotac-handheld-gaming-console-homepage-slideshow-banners_1920x580-3.png'
  },
  {
    img: '/zotac_gpu_server_-_slideshow_banners_1920x580.jpg'
  },
  {
    img: '/Smartphones.jpg'
  },
]

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === Promo_Banners_Main.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Manual navigation
  const goToSlide = (index: any) => {
    setCurrentImageIndex(index);
  };

  const goToPrevSlide = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? Promo_Banners_Main.length - 1 : prevIndex - 1
    );
  };

  const goToNextSlide = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === Promo_Banners_Main.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <UserLayout>
      <div className="w-full flex flex-col gap-3 items-center justify-center">
        <div className="relative w-full h-[70dvh]">

          <div className="absolute w-full h-[70dvh] rounded-xl overflow-hidden">
            {/* Main div image with overlay */}
            <div className="relative w-full h-full">
              <Image
                src={Promo_Banners_Main[currentImageIndex].img}
                alt={`Banner ${currentImageIndex + 1}`}
                layout="fill"
                objectFit="cover"
                className="bg-cover bg-center transition-opacity duration-500"
              />

              {/* Navigation arrows */}
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <button
                  onClick={goToPrevSlide}
                  className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={goToNextSlide}
                  className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Dots indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {Promo_Banners_Main.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* inverted curves */}
            <div className="absolute bottom-[30%] w-5 h-5 rounded-full shadow-[-10px_10px_0_#fff] z-50"></div>
            <div className="absolute bottom-0 left-[30%] md:left-[20%] w-5 h-5 rounded-full shadow-[-10px_10px_0_#fff] z-50"></div>
          </div>

          {/* Small video */}
          <div className="absolute left-0 bottom-0 w-[30%] md:w-[20%] h-[30%] border-t-[10px] border-r-[10px] border-white rounded-tr-xl rounded-bl-xl overflow-hidden">
            {/* Video */}
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src="/lap.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
              {/* Mute/Unmute Button */}
              <button
                onClick={toggleMute}
                className="absolute bottom-2 right-2 z-50 bg-slate-50 text-black p-1 rounded-full shadow-md hover:bg-gray-200 transition"
              >
                {isMuted ? <VolumeOff className=' size-3' /> : <Volume2 className=' size-3' />}
              </button>
            </div>

            {/* Decorative Curves */}
            <div className="absolute top-0 left-0 w-5 h-5 rounded-full shadow-[-10px_-10px_0_#fff] z-40" />
            <div className="absolute top-0 right-0 w-5 h-5 rounded-full shadow-[10px_-10px_0_#fff] z-40" />
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full shadow-[10px_10px_0_#fff] z-40" />
          </div>

        </div>

        <div className="w-full h-[30dvh] sm:h-[25dvh] md:h-[20dvh] bg-primary rounded-xl relative overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{
              backgroundImage: "url('/customise.png')",
              filter: 'brightness(0.7)',
            }}
          ></div>

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col md:flex-row items-start md:items-center justify-center md:justify-between px-4 sm:px-6 md:px-8 py-4 gap-3 md:gap-0">
            <div className="text-white max-w-xl">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 nohemi-bold">
                Customize Your <span className="text-primary">Own PC</span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base opacity-90 mb-2">
                Build your dream gaming rig with premium components and expert assembly.
              </p>
            </div>

            <PrimaryLinkButton href="/">Start Building</PrimaryLinkButton>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}