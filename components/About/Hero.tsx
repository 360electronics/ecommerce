'use client';

import Image from 'next/image';
import React from 'react';

const HeroSection = () => {
    return (
        <div className="relative w-full h-[400px] overflow-hidden">
            <div className="absolute md:hidden lg:block inset-x-0 bottom-0 h-full">
                <svg
                    width="100%"
                    height="300"
                    viewBox="0 0 1328 324"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-[300px]"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <clipPath id="heroClip">
                            <path d="M1328 312C1328 318.627 1322.63 324 1316 324H12C5.37256 324 0 318.627 0 312V93C0 86.3726 5.37258 81 12 81H234C240.627 81 246 75.6274 246 69V51C246 44.3726 251.373 39 258 39H308C314.627 39 320 33.6274 320 27V12C320 5.37258 325.373 0 332 0H1316C1322.63 0 1328 5.37258 1328 12V312Z" />
                        </clipPath>

                        <pattern id="backgroundPattern" patternUnits="userSpaceOnUse" width="1328" height="324">
                            <image
                                href="/about/bannerImg.jpg" 
                                x="0"
                                y="0"
                                width="1328"
                                height="324"
                                preserveAspectRatio="xMidYMid slice"
                            />
                        </pattern>

                        {/* Optional fallback gradient */}
                        <linearGradient id="fallbackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>

                    {/* Main shape filled with image pattern */}
                    <path
                        d="M1328 312C1328 318.627 1322.63 324 1316 324H12C5.37256 324 0 318.627 0 312V93C0 86.3726 5.37258 81 12 81H234C240.627 81 246 75.6274 246 69V51C246 44.3726 251.373 39 258 39H308C314.627 39 320 33.6274 320 27V12C320 5.37258 325.373 0 332 0H1316C1322.63 0 1328 5.37258 1328 12V312Z"
                        fill="url(#backgroundPattern)"
                    />

                    {/* Optional dark overlay */}
                    <path
                        d="M1328 312C1328 318.627 1322.63 324 1316 324H12C5.37256 324 0 318.627 0 312V93C0 86.3726 5.37258 81 12 81H234C240.627 81 246 75.6274 246 69V51C246 44.3726 251.373 39 258 39H308C314.627 39 320 33.6274 320 27V12C320 5.37258 325.373 0 332 0H1316C1322.63 0 1328 5.37258 1328 12V312Z"
                        fill="black"
                        fillOpacity="0.2"
                    />
                </svg>
            </div>

            <div className='lg:hidden '>
                <img
                    src="/about/bannerImg.jpg" 
                    width="1328"
                    height="324"
                    alt='BannerImg'
                />
            </div>

            <div className='absolute top-0 left-0 '>
                <h2 className='text-3xl text-right -mr-14'>Who are we</h2>
                <p className='lg:text-base xl:text-xl xl:mr-4'>Our vision & mission</p>
            </div>
        </div>
    );
};

export default HeroSection;
