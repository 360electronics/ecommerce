'use client';

import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import DynamicFilter from '@/components/Filter/DynamicFilter';
import ProductCard from '@/components/Product/ProductCards/ProductCardwithCart';
import { useSearchParams } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import debounce from 'lodash/debounce';
import Fuse from "fuse.js";
import { FlattenedProduct } from '@/types/product';

const MemoizedProductCard = memo(ProductCard);

const ProductListing = ({
    category,
    searchQuery,
    initialProducts = []
}: {
    category?: string;
    searchQuery?: string;
    initialProducts?: FlattenedProduct[];
}) => {
    const [originalProducts] = useState<FlattenedProduct[]>(initialProducts);

    const [filteredProducts, setFilteredProducts] = useState<FlattenedProduct[]>([]);
    const [loading, setLoading] = useState(false); // Data is pre-fetched, so no initial loading
    const [error, setError] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState('featured');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(50);
    const [fuse, setFuse] = useState<Fuse<FlattenedProduct> | null>(null);
    const searchParams = useSearchParams();

    // console.log("Og Products", originalProducts)
    useEffect(() => {
        if (originalProducts.length > 0) {
            const fuseInstance = new Fuse(originalProducts, {
                keys: [
                    { name: 'name', weight: 0.4, getFn: (obj) => obj.name || '' },
                    { name: 'brand.name', weight: 0.3, getFn: (obj) => obj.brand?.name || '' },
                    { name: 'category.name', weight: 0.1, getFn: (obj) => obj.category?.name || '' },
                    { name: 'subcategory.name', weight: 0.1, getFn: (obj) => obj.subcategory?.name || '' },
                    { name: 'description', weight: 0.1, getFn: (obj) => obj.description || '' },
                ],
                threshold: 0.35,
                minMatchCharLength: 2,
                ignoreLocation: true,
                shouldSort: true,
                includeScore: true,
                useExtendedSearch: true,
            });
            setFuse(fuseInstance);
        }
    }, [originalProducts]);


    // Get subcategory from URL params
    const subcategory = searchParams.get('subcategory');

    // Memoized debounced filter function
    const debouncedApplyFilters = useMemo(
        () =>
            debounce(
                (productsList: FlattenedProduct[], filters: Record<string, any>, sortOpt: string, query: string) => {

                    // console.log(productsList)
                    let filtered = productsList.filter(
                        (product) =>
                            product.status &&
                            ['active', 'coming_soon'].includes(product.status.trim().toLowerCase())

                    );

                    // Apply category filter with exact matching
                    if (category && category.toLowerCase() !== 'all') {
                        filtered = filtered.filter(
                            (product) =>
                                product.category &&
                                (product.category as unknown as string).toLowerCase() ===
                                category.toLowerCase()
                        );
                    }

                    // Apply subcategory filter if provided
                    if (subcategory && subcategory.toLowerCase() !== 'all') {
                        filtered = filtered.filter((product) =>
                            product.subcategory && (product.subcategory as unknown as string).toLowerCase() === subcategory.toLowerCase()
                        );
                    }

                    // Apply search query filter (with Fuse.js)
                    if (query?.trim()) {
                        let results: FlattenedProduct[] = [];

                        if (fuse) {
                            const fuseResults = fuse.search(query.trim());
                            results = fuseResults.map(r => r.item);
                            // console.log('Fuse search results:', fuseResults); // <-- debug Fuse output
                        }
                        // Fallback if Fuse found nothing → simple includes
                        if (results.length === 0) {
                            const q = query.trim().toLowerCase();
                            results = productsList.filter(p =>
                                (p.name || '').toLowerCase().includes(q) ||
                                (p.brand?.name || '').toLowerCase().includes(q) ||
                                (p.category.name || '').toLowerCase().includes(q) ||
                                (p.subcategory.name || '').toLowerCase().includes(q) ||
                                (p.description || '').toLowerCase().includes(q)
                            );
                            // console.log('Fallback search results:', results); // <-- debug fallback
                        }

                        filtered = results;
                    }

                    // console.log('Final filtered products:', filtered);


                    // Apply color filter
                    if (filters.color?.length > 0) {
                        filtered = filtered.filter((product) =>
                            product.color && filters.color.includes(product.color)
                        );
                    }

                    // Apply storage filter
                    if (filters.storage?.length > 0) {
                        filtered = filtered.filter((product) =>
                            product.storage && filters.storage.includes(product.storage)
                        );
                    }

                    // Apply brand filter
                    if (filters.brand?.length > 0) {
                        filtered = filtered.filter((product) =>
                            product.brand && filters.brand.includes(product.brand.name)
                        );
                    }

                    // Apply rating filter
                    if (filters.rating?.length > 0) {
                        const minRating = Math.min(...filters.rating.map((r: string) => parseInt(r)));
                        filtered = filtered.filter((product) => {
                            return (Number(product.averageRating) || 0) >= minRating;
                        });
                    }

                    // Apply stock filter
                    if (filters.inStock) {
                        filtered = filtered.filter((product) => Number(product.totalStocks) > 0);
                    }

                    const normalizeValue = (val: string): string => {
                        if (!val) return "";

                        let v = val.trim().replace(/\s+/g, " ").toLowerCase();
                        let brand = "";

                        // --- Detect explicit brand ---
                        if (/\bamd\b/i.test(v)) brand = "AMD";
                        else if (/\bintel\b/i.test(v)) brand = "Intel";
                        else if (/\bnvidia\b/i.test(v)) brand = "NVIDIA";
                        else if (/\bmsi\b/i.test(v)) brand = "MSI";
                        else if (/\basus\b/i.test(v)) brand = "Asus";

                        // --- Remove duplicate brand mentions ---
                        if (brand) {
                            const brandRegex = new RegExp(`\\b(${brand})\\b`, "ig");
                            v = v.replace(brandRegex, "").trim();
                        }

                        // --- Series inference ---
                        if (/ryzen\s*[3579]/i.test(v)) {
                            if (!brand) brand = "AMD";
                            v = v.replace(/ryzen\s*([3579]).*/i, "Ryzen $1");
                        }
                        if (/core\s*i\s*[3579]/i.test(v)) {
                            if (!brand) brand = "Intel";
                            v = v.replace(/core\s*i\s*([3579]).*/i, "Core i$1");
                        }
                        if (/rtx\s*\d+/i.test(v)) {
                            if (!brand) brand = "NVIDIA";
                            v = v.replace(/geforce\s*/i, "");
                            v = v.replace(/\brtx\s*(\d+).*/i, "RTX $1");
                        }

                        // --- Special inference for laptop lines ---
                        if (/tuf\s+gaming/i.test(v)) {
                            if (!brand) brand = "Asus";
                            v = v.replace(/tuf\s+gaming/i, "TUF Gaming");
                        }
                        if (/rog\s+/i.test(v)) {
                            if (!brand) brand = "Asus";
                            v = v.replace(/rog\s+/i, "ROG ");
                        }

                        // --- Storage normalization ---
                        v = v.replace(/(\d+)\s*(gb|ssd|hdd)/i, "$1 GB");
                        v = v.replace(/(\d+)(gb|ssd|hdd)/i, "$1 GB");

                        // --- Display sizes ---
                        v = v.replace(/(\d+(\.\d+)?)\s*cm\s*\((\d+(\.\d+)?)\s*inch\)/i, "$3 inch");

                        // --- Collapse duplicate words ---
                        v = v.replace(/\b(\w+)( \1\b)+/gi, "$1");

                        // --- Title case ---
                        v = v.replace(/\b\w/g, (c) => c.toUpperCase());

                        // --- Prepend brand (avoid duplicates) ---
                        if (brand && !v.startsWith(brand)) {
                            v = `${brand} ${v}`;
                        }

                        return v.trim();
                    };



                    // Apply dynamic attribute filters
                    Object.keys(filters).forEach((key) => {
                        if (
                            !['ourPrice', 'color', 'storage', 'brand', 'rating', 'inStock', 'category'].includes(key) &&
                            Array.isArray(filters[key])
                        ) {
                            filtered = filtered.filter((product) => {
                                const productVal = product.attributes?.[key];
                                if (!productVal) return false;

                                // Normalize both product attribute & filter values
                                const normalizedProductVal = normalizeValue(productVal);
                                const normalizedFilterVals = filters[key].map((v: string) => normalizeValue(v));

                                return normalizedFilterVals.includes(normalizedProductVal);
                            });
                        }
                    });


                    // Apply sorting
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
                                const dateA = new Date(a.createdAt).getTime();
                                const dateB = new Date(b.createdAt).getTime();
                                return dateB - dateA;
                            });
                            break;
                        case 'featured':
                        default:
                            break;
                    }

                    setFilteredProducts(sorted);
                    setCurrentPage(1);
                },
                300
            ),
        [category, subcategory, searchQuery, fuse]
    );

    useEffect(() => {
        return () => {
            debouncedApplyFilters.cancel();
        };
    }, [debouncedApplyFilters]);

    // Compute filter options based on ALL products, not just filtered ones
    const filterOptions = useMemo(() => {
        const options = {
            colors: new Set<string>(),
            brands: new Set<string>(),
            storageOptions: new Set<string>(),
            minPrice: Infinity,
            maxPrice: 0,
            attributes: {} as { [key: string]: Set<string> },
        };

        // Use originalProducts for filter options to show all available options
        let productsForOptions = originalProducts;

        // If we have category/subcategory filters, apply them to get relevant filter options
        if (category && category.toLowerCase() !== 'all') {
            productsForOptions = productsForOptions.filter((product) =>
                product.category && (product.category as unknown as string).toLowerCase() === category.toLowerCase()
            );
        }

        if (subcategory && subcategory.toLowerCase() !== 'all') {
            productsForOptions = productsForOptions.filter((product) =>
                product.subcategory && (product.subcategory as unknown as string).toLowerCase() === subcategory.toLowerCase()
            );
        }

        productsForOptions.forEach((product) => {
            if (product.color) options.colors.add(product.color);
            if (product.brand?.name) options.brands.add(product.brand.name);
            if (product.storage) options.storageOptions.add(product.storage);
            const price = Number(product.ourPrice) || 0;
            if (price > 0) {
                options.minPrice = Math.min(options.minPrice, price);
                options.maxPrice = Math.max(options.maxPrice, price);
            }

            // Process dynamic attributes
            if (product.attributes) {
                Object.entries(product.attributes).forEach(([key, value]) => {
                    if (typeof value === 'string' && value.trim()) {
                        if (!options.attributes[key]) {
                            options.attributes[key] = new Set<string>();
                        }
                        options.attributes[key].add(value);
                    }
                });
            }
        });

        return {
            colors: Array.from(options.colors).sort(),
            brands: Array.from(options.brands).sort(),
            storageOptions: Array.from(options.storageOptions).sort(),
            priceRange: {
                min: options.minPrice === Infinity ? 0 : Math.floor(options.minPrice),
                max: options.maxPrice === 0 ? 1000 : Math.ceil(options.maxPrice),
            },
            attributes: Object.fromEntries(
                Object.entries(options.attributes).map(([key, valueSet]) => [key, Array.from(valueSet).sort()])
            ),
        };
    }, [originalProducts, category, subcategory]);

    // Apply filters when dependencies change
    useEffect(() => {
        // console.log('Search query:', searchQuery);
        if (originalProducts.length === 0) return;

        const filters: Record<string, any> = {};
        // console.log('Applied filters:', filters);
        const maxPrice = searchParams.get('maxPrice');

        if (maxPrice) {
            filters.ourPrice = {
                min: filterOptions.priceRange.min,
                max: Number(maxPrice),
            };
        }

        const possibleFilters = ['color', 'brand', 'category', 'rating', 'storage', ...Object.keys(filterOptions.attributes)];
        possibleFilters.forEach(filter => {
            const values = searchParams.getAll(filter);
            if (values.length > 0) {
                filters[filter] = values;
            }
        });

        if (searchParams.get('inStock') === 'true') {
            filters.inStock = true;
        }

        debouncedApplyFilters(originalProducts, filters, sortOption, searchQuery || '');
    }, [searchParams, sortOption, originalProducts, filterOptions, debouncedApplyFilters, searchQuery, category, subcategory]);

    const displayedProducts = useMemo(() => {
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    }, [currentPage, filteredProducts, productsPerPage]);

    const handleFilterChange = (filters: Record<string, any>) => {
        debouncedApplyFilters(originalProducts, filters, sortOption, searchQuery || '');
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortOption(e.target.value);
    };

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
                aria-label="Go to first page"
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
                    aria-label={`Go to page ${i}`}
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
                    aria-label={`Go to last page, page ${totalPages}`}
                >
                    {totalPages}
                </button>
            );
        }

        return buttons;
    };

    // Helper function to get display text for category/subcategory
    const formatText = (text: string) => {
        if (!text) return "";

        return text
            .replace(/[-_]/g, " ")                // replace hyphens/underscores with spaces
            .toLowerCase()                        // make all lowercase first
            .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize first letter of each word
    };

    const getDisplayText = () => {
        const parts = [];
        if (filteredProducts.length > 0) {
            parts.push(`${filteredProducts.length} ${filteredProducts.length === 1 ? 'Product' : 'Products'}`);
        }

        if (category && category !== 'all') {
            parts.push(`in ${formatText(DOMPurify.sanitize(category))}`);
        }

        if (subcategory && subcategory !== 'all') {
            parts.push(`> ${formatText(DOMPurify.sanitize(subcategory))}`);
        }

        if (searchQuery?.trim()) {
            parts.push(`for "${formatText(DOMPurify.sanitize(searchQuery))}"`);
        }

        return parts.join(' ');
    };

    const asideRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (mainRef.current && asideRef.current) {
            const mainHeight = mainRef.current.offsetHeight;
            asideRef.current.style.maxHeight = `${mainHeight}px`;
        }
    }, [filteredProducts, currentPage, loading, error, sortOption, searchParams]);

    return (
        <div className="mx-auto" role="main">
            <div className="flex flex-col md:flex-row gap-6">
                {!loading && filteredProducts.length > 0 && (
                    <aside ref={asideRef} className="w-full md:w-1/4 flex overflow-y-auto">
                        <DynamicFilter
                            products={filteredProducts}
                            category={category}
                            onFilterChange={handleFilterChange}
                            filterOptions={filterOptions}
                        />
                        <div className="items-center flex md:hidden justify-center text-center w-full">
                            <select
                                id="sort"
                                className="text-sm border-y border-l w-full border-gray-300 text-center flex items-center justify-center p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    </aside>
                )}

                <main ref={mainRef} className={`w-full ${filteredProducts.length > 0 ? 'md:w-3/4' : 'md:w-full'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
                        <div className="text-sm md:text-lg font-medium text-gray-800 mb-4 sm:mb-0">
                            {getDisplayText()}
                        </div>

                        <div className="items-center hidden md:flex">
                            <label htmlFor="sort" className="text-sm text-gray-600 mr-2">
                                Sort by:
                            </label>
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
                                onClick={() => {
                                    setError(null);
                                    // Retry logic would need to be implemented here
                                }}
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
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center" aria-live="polite">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-xl font-medium text-gray-800 mb-2">No products found</h3>
                            <p className="text-gray-600">Try adjusting your filters or search query to find what you&apos;re looking for.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedProducts.map((product, index) => (
                                    <MemoizedProductCard
                                        productId={product.productId}
                                        variantId={product.id}
                                        key={index}
                                        slug={product.slug}
                                        name={product.name}
                                        status={product.status}
                                        image={
                                            Array.isArray(product.productImages) && product.productImages.length > 0
                                                ? product.productImages?.[0]?.url
                                                : '/placeholder.svg'
                                        }
                                        ourPrice={Number(product.ourPrice) || 0}
                                        mrp={Number(product.mrp) || 0}
                                        rating={Number(product.averageRating) || 0}
                                        discount={
                                            product.mrp && product.ourPrice
                                                ? Math.round(
                                                    ((Number(product.mrp) - Number(product.ourPrice)) /
                                                        Number(product.mrp)) *
                                                    100
                                                )
                                                : 0
                                        }
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
                                        prev
                                    </button>

                                    {renderPaginationButtons()}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300"
                                        aria-label="Next page"
                                    >
                                        next
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProductListing;