import ProductCardwithoutCart from "@/components/Product/ProductCards/ProductCardwithoutCart";
import { NewArrivalsData } from "./Data";
import PrimaryLinkButton from "@/components/Reusable/PrimaryLinkButton";

const NewArrivals: React.FC = () => {
    return (
        <div className="py-6 md:py-12">
            {/* Mobile-only top title with improved spacing and font size */}
            <div className="md:hidden container mx-auto px-4 mb-4">
                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold nohemi-bold">
                        New <span className="text-primary">Arrivals</span>
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 max-w-xs mx-auto">
                        The Future of Tech Starts Here, Unbox what's New & Next.
                    </p>
                </div>
            </div>

            {/* Products Carousel with side title for desktop */}
            <div className="mx-auto ">
                <div className="relative">
                    <div className="flex overflow-x-auto pb-4 sm:pb-6 snap-x snap-mandatory minimal-scrollbar gap-3 sm:gap-5 scrollbar-hide">
                        {/* Left Section - Hidden on mobile, visible on md and up */}
                        <div className="hidden md:flex mb-8 text-start snap-start flex-shrink-0 w-80 flex-col justify-center items-start">
                            <h2 className="text-3xl md:text-4xl font-bold mb-2 nohemi-bold">
                                New <br /><span className="text-primary">Arrivals</span>
                            </h2>
                            <p className="mb-4">The Future of Tech Starts Here, Unbox what's New & Next.</p>
                            <PrimaryLinkButton href="/">View All</PrimaryLinkButton>
                        </div>

                        {/* Product Cards - Optimized sizes for mobile */}
                        {NewArrivalsData.map((product, index) => (
                            <div 
                                key={product.id} 
                                className={`snap-start flex-shrink-0 ${index === 0 ? "pl-2" : ""}`}
                                style={{ width: 'calc(70vw - 24px)', maxWidth: '22rem' }}
                            >
                                <ProductCardwithoutCart
                                    className="w-full h-full"
                                    image={product.image}
                                    title={product.title}
                                    rating={product.rating}
                                    price={product.price}
                                    mrp={product.mrp}
                                    discount={product.discount}
                                />
                            </div>
                        ))}
                        
                        {/* Add a small space at the end for better UX */}
                        <div className="flex-shrink-0 w-4"></div>
                    </div>
                </div>
            </div>

            {/* Improved Mobile View All Button */}
            <div className="container mx-auto px-4 mt-6 md:hidden flex justify-center">
                <PrimaryLinkButton href="/" className="w-full max-w-xs">View All</PrimaryLinkButton>
            </div>
            
            {/* Pagination dots for mobile */}
            <div className="flex justify-center mt-4 md:hidden">
                <div className="flex space-x-2">
                    {NewArrivalsData.length > 0 && Array(Math.min(5, NewArrivalsData.length)).fill(0).map((_, index) => (
                        <div 
                            key={index} 
                            className={`h-2 w-2 rounded-full ${index === 0 ? "bg-primary" : "bg-gray-300"}`}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewArrivals;