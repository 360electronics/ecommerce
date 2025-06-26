'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import DynamicFilter from '@/components/Filter/DynamicFilter';
import ProductCard from '@/components/Product/ProductCards/ProductCardwithCart';
import { useSearchParams } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import debounce from 'lodash/debounce';
import { CompleteProduct, FlattenedProduct } from '@/types/product';
import { fetchProducts } from '@/utils/products.util';

// Helper function to safely convert to ISO string
const safeToISOString = (dateValue: Date | string | undefined | null): string => {
    if (!dateValue) return new Date().toISOString();
    if (dateValue instanceof Date) return dateValue.toISOString();
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
};

const MemoizedProductCard = memo(ProductCard);

const flattenProductVariants = (products: CompleteProduct[]): FlattenedProduct[] => {
    const flattened: FlattenedProduct[] = [];

    products.forEach(product => {
        if (Array.isArray(product.variants) && product.variants.length > 0) {
            product.variants.forEach(variant => {
                flattened.push({
                    ...variant,
                    id: variant.id,
                    productId: product.id,
                    category: product.category.name,
                    brand: product.brand,
                    averageRating: product.averageRating.toString(),
                    tags: Array.isArray(product.tags)
                        ? product.tags
                        : typeof product.tags === 'string'
                            ? (product.tags as string).split(',').map((tag: string) => tag.trim())
                            : [],
                    totalStocks: variant.stock.toString(),
                    createdAt: safeToISOString(variant.createdAt),
                    updatedAt: safeToISOString(variant.updatedAt),
                    color: variant.attributes?.color as string | undefined,
                    storage: variant.attributes?.storage as string | undefined,
                    description: product.description || '',
                    productParent: product,
                    material: variant.attributes?.material as string | undefined,
                    mrp: variant.mrp.toString(),
                    ourPrice: variant.ourPrice.toString()
                } as unknown as FlattenedProduct);
            });
        } else {
            flattened.push({
                ...product,
                id: product.id,
                productId: product.id,
                name: product.shortName || 'Unnamed Product',
                mrp: product.defaultVariant?.mrp?.toString() || '0',
                ourPrice: product.defaultVariant?.ourPrice?.toString() || '0',
                stock: product.totalStocks.toString(),
                slug: product.slug,
                sku: product.defaultVariant?.sku || '',
                tags: Array.isArray(product.tags)
                    ? product.tags
                    : typeof product.tags === 'string'
                        ? (product.tags as string).split(',').map((tag: string) => tag.trim())
                        : [],
                createdAt: safeToISOString(product.createdAt),
                updatedAt: safeToISOString(product.updatedAt),
                category: product.category.name,
                brand: product.brand,
                averageRating: product.averageRating.toString(),
                totalStocks: product.totalStocks.toString(),
                description: product.description || '',
            } as unknown as FlattenedProduct);
        }
    });

    return flattened;
};

const ProductListing = ({ category, searchQuery }: { category?: string; searchQuery?: string }) => {
    const [originalProducts, setOriginalProducts] = useState<FlattenedProduct[]>([]);
    const [products, setProducts] = useState<FlattenedProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<FlattenedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState('featured');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(9);
    const searchParams = useSearchParams();

    // Memoized debounced filter function
    const debouncedApplyFilters = useMemo(
        () =>
            debounce(
                (productsList: FlattenedProduct[], filters: Record<string, any>, sortOpt: string, query: string) => {
                    let filtered = [...productsList];

                    if (category && category.toLowerCase() !== 'all') {
                        filtered = filtered.filter((product) =>
                            product.category.toLowerCase().includes(category.toLowerCase())
                        );
                    }

                    if (query?.trim()) {
                        const sanitizedQuery = DOMPurify.sanitize(query.trim()).toLowerCase();
                        const queryWords = sanitizedQuery.split(/\s+/).filter(word => word.length > 0);
                        filtered = filtered.filter((product: FlattenedProduct) => {
                            const name = product.name.toLowerCase();
                            const category = product.category.toLowerCase();
                            const brand = product.brand?.name.toLowerCase() || '';
                            const description = product.description?.toLowerCase() || '';
                            const tags = product.tags.join(' ').toLowerCase();

                            return queryWords.every(
                                (word) =>
                                    name.includes(word) ||
                                    category.includes(word) ||
                                    brand.includes(word) ||
                                    description.includes(word) ||
                                    tags.includes(word)
                            );
                        });
                    }

                    if (filters.ourPrice) {
                        const minPrice = Number(filters.ourPrice.min) || 0;
                        const maxPrice = Number(filters.ourPrice.max) || Infinity;
                        filtered = filtered.filter((product) => {
                            const price = Number(product.ourPrice) || 0;
                            return price >= minPrice && price <= maxPrice;
                        });
                    }

                    if (filters.color?.length > 0) {
                        filtered = filtered.filter((product) =>
                            product.color && filters.color.includes(product.color)
                        );
                    }

                    if (filters.storage?.length > 0) {
                        filtered = filtered.filter((product) =>
                            product.storage && filters.storage.includes(product.storage)
                        );
                    }

                    if (filters.brand?.length > 0) {
                        filtered = filtered.filter((product) =>
                            product.brand && filters.brand.includes(product.brand.name)
                        );
                    }

                    if (filters.rating?.length > 0) {
                        const minRating = Math.min(...filters.rating.map((r: string) => parseInt(r)));
                        filtered = filtered.filter((product) => {
                            return (Number(product.averageRating) || 0) >= minRating;
                        });
                    }

                    if (filters.inStock) {
                        filtered = filtered.filter((product) => Number(product.totalStocks) > 0);
                    }

                    // Apply dynamic attribute filters
                    Object.keys(filters).forEach((key) => {
                        if (!['ourPrice', 'color', 'storage', 'brand', 'rating', 'inStock', 'category'].includes(key) && Array.isArray(filters[key])) {
                            filtered = filtered.filter((product) =>
                                product.attributes && product.attributes[key] && filters[key].includes(product.attributes[key])
                            );
                        }
                    });

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
        [category, searchQuery]
    );

    useEffect(() => {
        return () => {
            debouncedApplyFilters.cancel();
        };
    }, [debouncedApplyFilters]);

    // Compute filter options based on filteredProducts
    const filterOptions = useMemo(() => {
        const options = {
            colors: new Set<string>(),
            brands: new Set<string>(),
            storageOptions: new Set<string>(),
            minPrice: Infinity,
            maxPrice: 0,
            attributes: {} as { [key: string]: Set<string> },
        };

        filteredProducts.forEach((product) => {
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
            colors: Array.from(options.colors),
            brands: Array.from(options.brands),
            storageOptions: Array.from(options.storageOptions),
            priceRange: {
                min: options.minPrice === Infinity ? 0 : Math.floor(options.minPrice),
                max: options.maxPrice === 0 ? 1000 : Math.ceil(options.maxPrice),
            },
            attributes: Object.fromEntries(
                Object.entries(options.attributes).map(([key, valueSet]) => [key, Array.from(valueSet).sort()])
            ),
        };
    }, [filteredProducts]);

    // Fetch products only when category or searchQuery changes
    useEffect(() => {
        const fetchAllProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                const startTime = performance.now();
                const productData: CompleteProduct[] = await fetchProducts();

                if (!productData || productData.length === 0) {
                    throw new Error('No product data received');
                }

                const flattenedProducts = flattenProductVariants(productData);
                setOriginalProducts(flattenedProducts);
                setProducts(flattenedProducts);
                setFilteredProducts(flattenedProducts);
                const endTime = performance.now();
                console.log(`Product fetch took ${endTime - startTime}ms`);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load products. Please try again later.';
                setError(errorMessage);
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllProducts();
    }, [category, searchQuery]);

    // Apply filters when searchParams or sortOption change
    useEffect(() => {
        if (products.length === 0) return;

        const filters: Record<string, any> = {};
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

        debouncedApplyFilters(products, filters, sortOption, searchQuery || '');
    }, [searchParams, sortOption, products, filterOptions, debouncedApplyFilters, searchQuery]);

    const displayedProducts = useMemo(() => {
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    }, [currentPage, filteredProducts, productsPerPage]);

    const handleFilterChange = (filters: Record<string, any>) => {
        debouncedApplyFilters(products, filters, sortOption, searchQuery || '');
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

    return (
        <div className="container mx-auto py-8" role="main">
            <div className="flex flex-col md:flex-row gap-6">
                {!loading && filteredProducts.length > 0 && (
                    <aside className="w-full md:w-1/4">
                        <DynamicFilter
                            products={filteredProducts}
                            category={category}
                            onFilterChange={handleFilterChange}
                            filterOptions={filterOptions}
                        />
                    </aside>
                )}

                <main className={`w-full ${filteredProducts.length > 0 ? 'md:w-3/4' : 'md:w-full'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
                        <div className="text-lg font-medium text-gray-800 mb-4 sm:mb-0">
                            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
                            {category ? ` in ${DOMPurify.sanitize(category)}` : ''}
                            {searchQuery ? ` for "${DOMPurify.sanitize(searchQuery)}"` : ''}
                        </div>

                        <div className="flex items-center">
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
                                    fetchProducts();
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
                            <p className="text-gray-600">Try adjusting your filters or search query to find what you're looking for.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedProducts.map((product) => (
                                    <MemoizedProductCard
                                        productId={product.productId}
                                        variantId={product.id}
                                        key={product.id || product.sku}
                                        slug={product.slug}
                                        name={product.name}
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