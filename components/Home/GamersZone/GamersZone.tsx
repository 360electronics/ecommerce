'use client'
import React, { useState } from "react";
import ProductCardwithoutCart from "@/components/ProductCards/ProductCardwithoutCart";
import { GamersZoneData } from "./Data";

const categories = ["All", "Consoles", "Accessories", "Monitor", "Steerings & Chairs"];

const GamersZone: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredProducts =
        activeCategory === "All"
            ? GamersZoneData
            : GamersZoneData.filter((product) => product.category === activeCategory);

    return (
        <section className="py-8 md:py-12">
            <div className="mx-auto">
                {/* Title */}
                <div className="mb-6 text-start md:text-center">
                    <h2 className="text-3xl md:text-4xl font-bold nohemi-bold text-primary">
                        Gamers <span className="text-black">Zone</span>
                    </h2>
                </div>

                {/* Category Tabs - Scrollable on mobile */}
                <div className="flex overflow-x-auto pb-2 md:pb-0 md:flex-wrap md:justify-center gap-3 mb-6 minimal-scrollbar">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                                activeCategory === category
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-black border-gray-300 hover:border-primary"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Mobile: Horizontal scroll, Desktop: Grid layout */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No products found in this category.</p>
                    </div>
                ) : (
                    <div className="sm:hidden flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory minimal-scrollbar">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="snap-start flex-shrink-0 w-64">
                                <ProductCardwithoutCart
                                    className="w-full"
                                    image={product.image}
                                    title={product.title}
                                    rating={product.rating}
                                    price={product.price}
                                    mrp={product.mrp}
                                    discount={product.discount}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Tablet and Desktop: Grid layout */}
                {filteredProducts.length > 0 && (
                    <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id}>
                                <ProductCardwithoutCart
                                    className="w-full"
                                    image={product.image}
                                    title={product.title}
                                    rating={product.rating}
                                    price={product.price}
                                    mrp={product.mrp}
                                    discount={product.discount}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default GamersZone;