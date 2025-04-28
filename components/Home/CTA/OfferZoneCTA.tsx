import React from 'react';

interface OfferZoneCTAProps {
  backgroundImage?: string;
}

const OfferZoneCTA: React.FC<OfferZoneCTAProps> = ({ backgroundImage }) => {
  // Default styling with gradient
  const defaultStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(to right, #4f46e5, #7e22ce)'
  };
  
  // If backgroundImage is provided, use it instead of the gradient
  const backgroundStyle: React.CSSProperties = backgroundImage 
    ? { 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      } 
    : defaultStyle;

  // Optional overlay for better text readability when using image
  const overlayStyle: React.CSSProperties = backgroundImage 
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(79, 70, 229, 0.7)', // Indigo with opacity
        zIndex: 1
      }
    : {};

  
  // Content z-index when using overlay
  const contentStyle: React.CSSProperties = backgroundImage ? { position: 'relative', zIndex: 2, } : {};

  return (
    <div 
      className="py-8 my-10 px-4 rounded-xl"
      style={backgroundStyle}
    >
      {backgroundImage && <div style={overlayStyle} className=' rounded-xl opacity-30'></div>}
      
      <div 
        className=" px-10 mx-auto flex flex-col md:flex-row items-center justify-between"
        style={contentStyle}
      >
        <div className="mb-8 md:mb-0 text-center md:text-left">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-3 nohemi-bold">
            Special <span className=' text-primary-hover'>Offer Zone</span>
          </h2>
          <p className="text-indigo-100 text-lg mb-6 max-w-xl">
            Discover exclusive deals on our premium gaming peripherals. Limited time offers with up to 40% off on selected products.
          </p>
          <button className="bg-white text-primary hover:bg-indigo-50 transition-colors px-8 py-3 rounded-md font-medium">
            Shop Now
          </button>
        </div>
        
        <div className="relative">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <div className="text-white text-center">
              <span className="text-5xl font-bold nohemi-bold">40%</span>
              <p className="text-xl mt-2">OFF</p>
              <p className="text-sm mt-1 text-indigo-100">On selected items</p>
            </div>
          </div>
          
          <div className="absolute -top-3 -right-3 bg-red-500 rounded-full px-3 py-1 text-white text-sm font-bold">
            Limited Time
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferZoneCTA;