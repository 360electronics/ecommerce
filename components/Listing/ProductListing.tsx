'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import DynamicFilter from '@/components/Filter/DynamicFilter';
import ProductCard from '@/components/Product/ProductCards/ProductCardwithCart';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/types/product';
import { fetchProducts } from '@/utils/products.util';
import DOMPurify from 'isomorphic-dompurify';
import debounce from 'lodash/debounce';

// Memoize ProductCard to prevent unnecessary re-renders
const MemoizedProductCard = memo(ProductCard);

const ProductListing = ({ category, searchQuery }: { category?: string, searchQuery?: string }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState('featured');
    const searchParams = useSearchParams();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(9);
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);

    // Debounced search filter
    const debouncedApplyFilters = useMemo(
        () => debounce((productsList: Product[], filters: Record<string, any>, sortOpt: string, query: string) => {
            let filtered = [...productsList];

            // Apply search query filter
            if (query) {
                const sanitizedQuery = DOMPurify.sanitize(query.trim()).toLowerCase();
                filtered = filtered.filter((product: Product) =>
                    product.name.toLowerCase().includes(sanitizedQuery) ||
                    product.category.toLowerCase().includes(sanitizedQuery) ||
                    (product.brand?.toLowerCase().includes(sanitizedQuery)) ||
                    (product.description?.toLowerCase().includes(sanitizedQuery))
                );
            }

            // Apply category filter
            if (category && category.toLowerCase() !== 'all') {
                filtered = filtered.filter(product => product.category.toLowerCase() === category.toLowerCase());
            }

            // Apply price filter with fixed minimum price of 100
            if (filters.ourPrice) {
                const minPrice = 100; // Fixed minimum price
                const maxPrice = Number(filters.ourPrice.max) || Infinity;
                filtered = filtered.filter(product => {
                    const price = Number(product.ourPrice) || 0;
                    return price >= minPrice && price <= maxPrice;
                });
            }

            // Apply color filter
            if (filters.color?.length > 0) {
                filtered = filtered.filter(product =>
                    product.color && filters.color.includes(product.color)
                );
            }

            // Apply brand filter
            if (filters.brand?.length > 0) {
                filtered = filtered.filter(product =>
                    product.brand && filters.brand.includes(product.brand)
                );
            }

            // Apply rating filter
            if (filters.rating?.length > 0) {
                filtered = filtered.filter(product => {
                    const minRating = Math.min(...filters.rating.map((r: string) => parseInt(r)));
                    return (Number(product.averageRating) || 0) >= minRating;
                });
            }

            // Apply stock filter
            if (filters.inStock) {
                filtered = filtered.filter(product => Number(product.totalStocks) > 0);
            }

            // Sort the filtered products
            const sorted = [...filtered];
            switch (sortOpt.toLowerCase()) {
                case 'ourprice-low-high':
                    sorted.sort((a, b) => (Number(a.ourPrice) || 0) - (Number(b.ourPrice) || 0));
                    break;
                case 'ourprice-high-low':
                    sorted.sort((a, b) => (Number(b.ourPrice) || 0) - (Number(a.ourPrice) || 0));
                    break;
                case 'rating':
                    sorted.sort((a, b) => (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0));
                    break;
                case 'newest':
                    sorted.sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA;
                    });
                    break;
                case 'featured':
                default:
                    break;
            }

            setFilteredProducts(sorted);
            setCurrentPage(1);
        }, 300),
        [category]
    );

    useEffect(() => {
        const fetchAllProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                const startTime = performance.now();
                const productData = await fetchProducts();

                if (!productData) {
                    throw new Error('No product data received');
                }

                setProducts(productData);

                // Get filter values from URL params
                const filters: Record<string, any> = {};

                // Only get maxPrice from URL, minPrice is fixed at 100
                const maxPrice = searchParams.get('maxPrice');

                if (maxPrice) {
                    filters.ourPrice = {
                        min: 100, // Fixed minimum price
                        max: Number(maxPrice)
                    };
                }

                const possibleFilters = ['color', 'brand', 'category', 'rating'];
                possibleFilters.forEach(filter => {
                    const values = searchParams.getAll(filter);
                    if (values.length > 0) {
                        filters[filter] = values;
                    }
                });

                if (searchParams.get('inStock') === 'true') {
                    filters.inStock = true;
                }

                // Apply filters from URL
                debouncedApplyFilters(productData, filters, sortOption, searchQuery || '');

                const endTime = performance.now();
                console.log(`Product fetch and initial filter took ${endTime - startTime}ms`);
            } catch (err) {
                setError('Failed to load products. Please try again later.');
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllProducts();
    }, [category, searchQuery, debouncedApplyFilters, searchParams]);

    useEffect(() => {
        updateDisplayedProducts();
    }, [currentPage, filteredProducts]);

    const handleFilterChange = (filters: Record<string, any>) => {
        debouncedApplyFilters(products, filters, sortOption, searchQuery || '');
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const option = e.target.value;
        setSortOption(option);
        debouncedApplyFilters(products, {}, option, searchQuery || '');
    };

    const updateDisplayedProducts = () => {
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        setDisplayedProducts(filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct));
    };

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        const maxButtons = 5;

        buttons.push(
            <button
                key="first"
                onClick={() => handlePageChange(1)}
                className={`px-3 py-1 mx-1 rounded ${currentPage === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                disabled={currentPage === 1}
                aria-label="First page"
            >
                1
            </button>
        );

        let startPage = Math.max(2, currentPage - Math.floor(maxButtons / 2));
        const endPage = Math.min(totalPages - 1, startPage + maxButtons - 3);

        if (endPage - startPage < maxButtons - 3) {
            startPage = Math.max(2, endPage - (maxButtons - 3) + 1);
        }

        if (startPage > 2) {
            buttons.push(<span key="ellipsis1" className="px-2" aria-hidden="true">...</span>);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 mx-1 rounded ${currentPage === i ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    aria-label={`Page ${i}`}
                    aria-current={currentPage === i ? 'page' : undefined}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages - 1) {
            buttons.push(<span key="ellipsis2" className="px-2" aria-hidden="true">...</span>);
        }

        if (totalPages > 1) {
            buttons.push(
                <button
                    key="last"
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 mx-1 rounded ${currentPage === totalPages ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    disabled={currentPage === totalPages}
                    aria-label="Last page"
                >
                    {totalPages}
                </button>
            );
        }

        return buttons;
    };

    // Memoize displayed products to prevent unnecessary re-renders
    const memoizedDisplayedProducts = useMemo(() => displayedProducts, [displayedProducts]);

    return (
        <div className="container mx-auto py-8" role="main">
            <div className="flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-1/4">
                    <DynamicFilter
                        products={
                            // Filter products by category and search query first
                            products.filter((product) => {
                                // Apply category filter if provided
                                const categoryMatch = !category || category.toLowerCase() === 'all' ||
                                    product.category.toLowerCase() === category.toLowerCase();

                                // Apply search query filter if provided
                                let queryMatch = true;
                                if (searchQuery) {
                                    const sanitizedQuery = DOMPurify.sanitize(searchQuery.trim()).toLowerCase();
                                    queryMatch = product.name.toLowerCase().includes(sanitizedQuery) ||
                                    product.category.toLowerCase().includes(sanitizedQuery) ||
                                    product.brand?.toLowerCase().includes(sanitizedQuery) === true ||
                                    product.description?.toLowerCase().includes(sanitizedQuery) === true;
                                
                                }

                                return categoryMatch && queryMatch;
                            })
                        }
                        category={category}
                        onFilterChange={handleFilterChange}
                    />
                </aside>

                <main className="w-full md:w-3/4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
                        <div className="text-lg font-medium text-gray-800 mb-4 sm:mb-0">
                            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
                            {category ? ` in ${DOMPurify.sanitize(category)}` : ''}
                            {searchQuery ? ` for "${DOMPurify.sanitize(searchQuery)}"` : ''}
                        </div>

                        <div className="flex items-center">
                            <label htmlFor="sort" className="text-sm text-gray-600 mr-2 sr-only">Sort by</label>
                            <select
                                id="sort"
                                className="text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={sortOption}
                                onChange={handleSortChange}
                                aria-label="Sort products"
                            >
                                <option value="featured">Featured</option>
                                <option value="ourprice-low-high">Price: Low to High</option>
                                <option value="ourprice-high-low">Price: High to Low</option>
                                <option value="rating">Best Rating</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                    </div>

                    {error ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center" role="alert">
                            <h3 className="text-xl font-medium text-red-600 mb-2">{error}</h3>
                            <button
                                onClick={() => fetchProducts()}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
                            {Array.from({ length: productsPerPage }).map((_, index) => (
                                <div key={index} className="animate-pulse">
                                    <div className="bg-gray-200 h-48 w-full rounded mb-4"></div>
                                    <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                                    <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] text-center" aria-live="polite">
                                    <div className="text-4xl mb-4">🔍</div>
                                    <h3 className="text-xl font-medium text-gray-800 mb-2">No products found</h3>
                                    <p className="text-gray-600">Try adjusting your filters to find what you&apos;re looking for.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {memoizedDisplayedProducts.map((product) => (
                                            <MemoizedProductCard
                                                key={product.id || product.sku}
                                                slug={product.slug}
                                                name={product.name}
                                                image={product.productImages?.[0] ?? '/placeholder.svg'}
                                                ourPrice={Number(product.ourPrice) || 0}
                                                mrp={Number(product.mrp) || 0}
                                                rating={Number(product.averageRating) || 0}
                                                discount={product.discount ?? 0}
                                                showViewDetails={true}
                                                isHeartNeed={true}
                                            />
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <nav className="flex justify-center items-center mt-8" aria-label="Pagination">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300"
                                                aria-label="Previous page"
                                            >
                                                &lt;
                                            </button>

                                            {renderPaginationButtons()}

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300"
                                                aria-label="Next page"
                                            >
                                                &gt;
                                            </button>
                                        </nav>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProductListing;