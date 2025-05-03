'use client';

import React, { useState, useEffect } from 'react';
import DynamicFilter from '@/components/Filter/DynamicFilter';
import ProductCard from '@/components/Product/ProductCards/ProductCardwithCart';
import { useSearchParams } from 'next/navigation';
import { Product, ProductsData } from '@/data/products';

const ProductListing = ({ category, searchQuery }: { category?: string, searchQuery?: string }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState('featured');
    const searchParams = useSearchParams();
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(9);
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);

    // Mock products data (in a real app, you'd fetch this from an API)
    useEffect(() => {
        // Simulating API call to fetch products
        const fetchProducts = async () => {
            setLoading(true);

            const productData = ProductsData;

            // First apply search query filter if provided
            let filteredData = productData;
            
            if (searchQuery && searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase().trim();
                filteredData = productData.filter(product => 
                    product.title.toLowerCase().includes(query) ||
                    product.category.toLowerCase().includes(query) ||
                    (product.brand && product.brand.toLowerCase().includes(query)) ||
                    (product.description && product.description.toLowerCase().includes(query))
                );
            }
            
            // Then apply category filter if provided (show all products if category is 'all')
            const categoryFiltered = category && category.toLowerCase() !== 'all'
                ? filteredData.filter(product => product.category.toLowerCase() === category.toLowerCase())
                : filteredData;

            setProducts(categoryFiltered);
            applyFiltersAndSort(categoryFiltered, {}, sortOption);
            setLoading(false);
        };

        fetchProducts();
        setCurrentPage(1); // Reset to first page when category or search query changes
    }, [category, searchQuery]);

    // Update displayed products when page changes or filtered products change
    useEffect(() => {
        updateDisplayedProducts();
    }, [currentPage, filteredProducts]);

    // Apply filters when filters change
    const handleFilterChange = (filters: any) => {
        applyFiltersAndSort(products, filters, sortOption);
    };

    // Apply both filters and sort in one function to ensure consistent behavior
    const applyFiltersAndSort = (productsList: Product[], filters: any, sortOpt: string) => {
        let filtered = [...productsList];

        // Apply price filter
        if (filters.price) {
            filtered = filtered.filter(product =>
                product.price >= filters.price.min && product.price <= filters.price.max
            );
        }

        // Apply color filter
        if (filters.color && filters.color.length > 0) {
            filtered = filtered.filter(product =>
                product.color && filters.color.includes(product.color)
            );
        }

        // Apply brand filter
        if (filters.brand && filters.brand.length > 0) {
            filtered = filtered.filter(product =>
                filters.brand.includes(product.brand)
            );
        }

        // Apply rating filter
        if (filters.rating && filters.rating.length > 0) {
            filtered = filtered.filter(product => {
                const minRating = Math.min(...filters.rating.map((r: string) => parseInt(r)));
                return product.rating >= minRating;
            });
        }

        // Apply stock filter
        if (filters.inStock) {
            filtered = filtered.filter(product => product.availability);
        }

        // Sort the filtered products
        let sorted = [...filtered];
        switch (sortOpt) {
            case 'price-low-high':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-high-low':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                sorted.sort((a, b) => b.rating - a.rating); // Higher rating first
                break;
            case 'newest':
                // Using ID as a proxy for "newest"
                sorted.sort((a, b) => b.id - a.id);
                break;
            case 'featured':
            default:
                // For featured, we could implement custom logic or leave as is
                break;
        }

        setFilteredProducts(sorted);
        setCurrentPage(1); // Reset to first page when filters or sort changes
    };

    // Handle sort change
    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const option = e.target.value;
        setSortOption(option);
        applyFiltersAndSort(products, {}, option);
    };

    // Update displayed products based on current page
    const updateDisplayedProducts = () => {
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        setDisplayedProducts(filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct));
    };

    // Calculate total pages
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    // Handle page change
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Generate pagination buttons
    const renderPaginationButtons = () => {
        const buttons = [];
        const maxButtons = 5; // Maximum number of page buttons to show

        // Always show first page button
        buttons.push(
            <button
                key="first"
                onClick={() => handlePageChange(1)}
                className={`px-3 py-1 mx-1 rounded ${currentPage === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={currentPage === 1}
            >
                1
            </button>
        );

        // Calculate range of pages to show
        let startPage = Math.max(2, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxButtons - 3);
        
        if (endPage - startPage < maxButtons - 3) {
            startPage = Math.max(2, endPage - (maxButtons - 3) + 1);
        }

        // Add ellipsis after first page if needed
        if (startPage > 2) {
            buttons.push(<span key="ellipsis1" className="px-2">...</span>);
        }

        // Add page buttons
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 mx-1 rounded ${currentPage === i ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                    {i}
                </button>
            );
        }

        // Add ellipsis before last page if needed
        if (endPage < totalPages - 1) {
            buttons.push(<span key="ellipsis2" className="px-2">...</span>);
        }

        // Always show last page button if there's more than one page
        if (totalPages > 1) {
            buttons.push(
                <button
                    key="last"
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 mx-1 rounded ${currentPage === totalPages ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    disabled={currentPage === totalPages}
                >
                    {totalPages}
                </button>
            );
        }

        return buttons;
    };

    return (
        <div className=" mx-auto py-8">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Filters - Left Sidebar for desktop */}
                <div className="w-full md:w-1/4">
                    <DynamicFilter
                        products={products}
                        category={category}
                        onFilterChange={handleFilterChange}
                    />
                </div>

                {/* Products - Right side */}
                <div className="w-full md:w-3/4">
                    {/* Top bar with sort and count */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
                        <div className="text-lg font-medium text-gray-800 mb-4 sm:mb-0">
                            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} 
                            {category ? ` in ${category}` : ''}
                            {searchQuery ? ` for "${searchQuery}"` : ''}
                        </div>

                        <div className="flex items-center">
                            <label htmlFor="sort" className="text-sm text-gray-600 mr-2">Sort by:</label>
                            <select
                                id="sort"
                                className="text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={sortOption}
                                onChange={handleSortChange}
                            >
                                <option value="featured">Featured</option>
                                <option value="price-low-high">Price: Low to High</option>
                                <option value="price-high-low">Price: High to Low</option>
                                <option value="rating">Best Rating</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading ? (
                        <div className="flex justify-center items-center min-h-[400px]">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Empty state */}
                            {filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                                    <div className="text-4xl mb-4">🔍</div>
                                    <h3 className="text-xl font-medium text-gray-800 mb-2">No products found</h3>
                                    <p className="text-gray-600">Try adjusting your filters to find what you're looking for.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Product grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {displayedProducts.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                title={product.title}
                                                image={product.image}
                                                price={product.price}
                                                mrp={product.mrp}
                                                rating={product.rating}
                                                discount={product.discount}
                                                showViewDetails={true}
                                                isHeartNeed={true}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center mt-8">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
                                            >
                                                &lt;
                                            </button>
                                            
                                            {renderPaginationButtons()}
                                            
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
                                            >
                                                &gt;
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductListing;