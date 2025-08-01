'use client'
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)));
      setScrollProgress(progress);

      // Check which items are visible
      const items = timelineRef.current.querySelectorAll('.timeline-item');
      const newVisibleItems: number[] = [];
      
      items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        if (itemRect.top < windowHeight * 0.8) {
          newVisibleItems.push(index);
        }
      });
      
      setVisibleItems(newVisibleItems);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full bg-white dark:bg-neutral-950 font-sans md:px-10">
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="text-lg md:text-4xl mb-4 text-black dark:text-white max-w-4xl">
          My Journey Timeline
        </h2>
        <p className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base max-w-sm">
          From opening our first retail store to launching our e-commerce platform.
        </p>
      </div>

      <div ref={timelineRef} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className={`timeline-item flex justify-start pt-10 md:pt-40 md:gap-10 transition-all duration-700 ${
              visibleItems.includes(index) 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-30 translate-y-8'
            }`}
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className={`h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-black flex items-center justify-center transition-all duration-500 ${
                visibleItems.includes(index) ? 'scale-110' : 'scale-100'
              }`}>
                <div className={`h-4 w-4 rounded-full border-2 transition-all duration-500 ${
                  visibleItems.includes(index) 
                    ? 'bg-blue-500 border-blue-500 scale-125' 
                    : 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                }`} />
              </div>
              <h3 className={`hidden md:block text-xl md:pl-20 md:text-5xl font-bold transition-all duration-500 ${
                visibleItems.includes(index) 
                  ? 'text-black dark:text-white' 
                  : 'text-neutral-500 dark:text-neutral-500'
              }`}>
                {item.title}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className={`md:hidden block text-2xl mb-4 text-left font-bold transition-all duration-500 ${
                visibleItems.includes(index) 
                  ? 'text-black dark:text-white' 
                  : 'text-neutral-500 dark:text-neutral-500'
              }`}>
                {item.title}
              </h3>
              <div className={`transition-all duration-700 delay-200 ${
                visibleItems.includes(index) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-70 translate-y-4'
              }`}>
                {item.content}
              </div>
            </div>
          </div>
        ))}
        
        {/* Static background line */}
        <div className="absolute md:left-8 left-8 top-0 w-[2px] bg-gradient-to-b from-transparent via-neutral-200 dark:via-neutral-700 to-transparent"
             style={{ height: '100%' }}>
          {/* Animated progress line */}
          <div 
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent rounded-full transition-all duration-300 ease-out"
            style={{ 
              height: `${scrollProgress * 100}%`,
              opacity: Math.min(1, scrollProgress * 2)
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;