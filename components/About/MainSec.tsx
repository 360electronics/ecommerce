import React from 'react';

// SVG Components - Increased dimensions
const GrayCardSVG = () => (
  <svg width="320" height="190" viewBox="0 0 256 172" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path fillRule="evenodd" clipRule="evenodd" d="M256 12C256 5.37258 250.627 0 244 0H12C5.37258 0 0 5.37258 0 12V160C0 166.627 5.37258 172 12 172H137.678C144.306 172 149.678 166.627 149.678 160V114C149.678 107.373 155.051 102 161.678 102H244C250.627 102 256 96.6274 256 90V12Z" fill="#D9D9D9" fillOpacity="0.25"/>
  </svg>
);

const BlueCardSVG = () => (
  <svg width="320" height="190" viewBox="0 0 256 172" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path fillRule="evenodd" clipRule="evenodd" d="M0 12C0 5.37258 5.37259 0 12 0H244C250.627 0 256 5.37258 256 12V160C256 166.627 250.627 172 244 172H118.322C111.694 172 106.322 166.627 106.322 160V114C106.322 107.373 100.949 102 94.3218 102H12C5.37259 102 0 96.6274 0 90V12Z" fill="#F2F7FF"/>
  </svg>
);

// Reusable Stats Card Component - Increased container size
const StatsCard = ({ number, description, numberColor = "text-black", cardType = "gray" }: { number: string, description: string, numberColor?: string, cardType?: string } ) => {
  const SVGComponent = cardType === "blue" ? BlueCardSVG : GrayCardSVG;
  
  // Function to render text with line breaks
  const renderDescription = (text: string) => {
    return text.split('<br/>').map((part, index, array) => (
      <React.Fragment key={index}>
        {part}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  return (
    <div className="relative w-80 h-48 overflow-visible">
      {/* SVG Background */}
      <div className="absolute inset-0">
        <SVGComponent />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-8 py-6 overflow-visible">
        {/* Number positioned in the upper area */}
        <div className=" flex items-center justify-center">
          <div className={`text-6xl md:text-7xl font-medium ${numberColor}`}>
            {number}
          </div>
        </div>
        
        {/* Description positioned to overflow outside the card */}
        <div className={`absolute top-28 pt-2 overflow-visible ${cardType === "blue" ? "right-24 pr-5" : "left-44 pl-5"} w-48`}>
          <div className="text-gray-700 font-light text-sm md:text-base leading-tight">
            {renderDescription(description)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats data object
const statsData = [
  {
    number: "120+",
    description: "Discover 120+ Showrooms at Prime Locations Near You.",
    numberColor: "text-black",
    cardType: "gray"
  },
  {
    number: "50k+",
    description: "Happy<br/>Customers",
    numberColor: "text-blue-500",
    cardType: "blue"
  },
  {
    number: "700+",
    description: "Delivering to 700+ cities across",
    numberColor: "text-black",
    cardType: "gray"
  }
];

// Main About Us Section Component
const AboutUsSection = () => {
  return (
    <div className="w-full overflow-visible">
      <div className=" mx-auto overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center overflow-visible">
          {/* Left Side - About Us Content */}
          <div className="bg-black text-white p-8 md:p-12 rounded-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">ABOUT US</h2>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              At Computer Garage, we take pride in being a leading electronics retailer with a robust 
              presence in Coimbatore and Chennai. Our specialization encompasses a wide array of 
              products, including the latest laptops, high-performance PCs, and cutting-edge gaming 
              equipment. Our mission is to deliver top-quality products paired with exceptional customer 
              service, ensuring that each client finds the perfect technological solutions tailored to their 
              needs.
            </p>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Our Commitment:</h3>
              <p className="text-gray-300 leading-relaxed">
                At Computer Garage, customer satisfaction is at the heart of our operations. Our 
                knowledgeable staff is dedicated to assisting customers in making informed decisions, 
                ensuring they invest in products that best suit their requirements. We also offer after-sales 
                support, reinforcing our commitment to building lasting relationships with our clientele. 
                By staying abreast of technological advancements and understanding the evolving needs of 
                our customers, Computer Garage continues to be a trusted name in electronics retail in 
                Coimbatore and Chennai.
              </p>
            </div>
          </div>

          {/* Right Side - Stats Cards with Staggered Layout */}
          <div className="relative overflow-visible" style={{ minHeight: '600px' }}>
            {/* First card - 120+ (top left) */}
            <div className="absolute top-0 left-0">
              <StatsCard
                number={statsData[0].number}
                description={statsData[0].description}
                numberColor={statsData[0].numberColor}
                cardType={statsData[0].cardType}
              />
            </div>
            
            {/* Second card - 50k+ (top right, offset down) */}
            <div className="absolute top-50 right-0">
              <StatsCard
                number={statsData[1].number}
                description={statsData[1].description}
                numberColor={statsData[1].numberColor}
                cardType={statsData[1].cardType}
              />
            </div>
            
            {/* Third card - 700+ (bottom left) */}
            <div className="absolute top-100 left-8">
              <StatsCard
                number={statsData[2].number}
                description={statsData[2].description}
                numberColor={statsData[2].numberColor}
                cardType={statsData[2].cardType}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsSection;