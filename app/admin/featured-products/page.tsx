'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Save, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchProducts as fetchAllProducts, fetchFeaturedProducts } from '@/utils/products.util';
import { Product } from '@/types/product';
import Image from 'next/image';



export default function FeaturedProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [featuredVariants, setFeaturedVariants] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const products = await fetchAllProducts();
        const featured = await fetchFeaturedProducts();

        if (products) setAllProducts(products);
        if (featured) {
          setFeaturedVariants(
            featured.map(({ productId, variantId, product, variant }:any) => ({
              productId,
              variantId,
              product,
              variant,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter available variants based on search term
  const filteredVariants = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const featuredVariantIds = featuredVariants.map((v) => v.variantId);

    // Flatten products to variants, excluding already featured ones
    return allProducts
      .flatMap((product) =>
        product.variants.map((variant) => ({
          productId: product.id,
          variantId: variant.id,
          product,
          variant,
        }))
      )
      .filter((selection) => !featuredVariantIds.includes(selection.variantId))
      .filter(
        (selection) =>
          selection.variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          selection.product.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          selection.variant.id.includes(searchTerm)
      );
  }, [allProducts, featuredVariants, searchTerm]);

  // Update search results
  useEffect(() => {
    setSearchResults(filteredVariants);
  }, [filteredVariants]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsLoading(true);
    setShowResults(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // Handle variant selection
  const handleSelectVariant = (selection: any) => {
    setFeaturedVariants((prev) => [...prev, selection]);
    setSearchResults((prev) => prev.filter((v) => v.variantId !== selection.variantId));
    setIsSaved(false);
    setSearchTerm('');
    setShowResults(false);
  };

  // Handle variant removal
  const handleRemoveVariant = async (variantId: string) => {
    try {
      const res = await fetch('/api/products/featured', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });

      if (!res.ok) throw new Error('Failed to remove variant');

      setFeaturedVariants((prev) => prev.filter((v) => v.variantId !== variantId));
      setIsSaved(false);
    } catch (error) {
      console.error('Remove variant error:', error);
      alert('Failed to remove featured variant');
    }
  };

  // Handle save
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const variantSelections = featuredVariants.map(({ productId, variantId }) => ({
        productId,
        variantId,
      }));

      const response = await fetch('/api/products/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantSelections }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save featured variants');
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving featured variants:', error);
      alert(error instanceof Error ? error.message : 'Failed to save featured variants');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setShowResults(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      {isSaved && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800 flex items-center justify-between">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            Featured variants have been saved successfully!
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsSaved(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search and add variants */}
      <div className="mb-8">
        <div className="relative flex flex-row items-center justify-between">
          <div className="relative w-full mr-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search variants by name or ID"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim()) setShowResults(true);
              }}
              className="pl-10 py-4 w-full pr-10"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={featuredVariants.length === 0 || isLoading}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Search results as variant cards */}
      {showResults && (
        <div ref={searchResultsRef} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              Search Results {searchResults.length > 0 ? `(${searchResults.length})` : ''}
            </h3>
            {searchResults.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowResults(false)}>
                Close
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">Searching variants...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {searchResults.map((selection) => (
                <div
                  key={selection.variantId}
                  className="relative cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handleSelectVariant(selection)}
                >
                  <div className="absolute right-3 top-3 z-20">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVariant(selection);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div>
                    <div className="mb-4 relative w-full aspect-square border group border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <Image
                          src={selection.variant.productImages[0] ?? '/placeholder.png'}
                          alt={selection.variant.name}
                          width={250}
                          height={250}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 duration-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                        {selection.variant.name}
                      </h3>
                      <p className="text-sm text-gray-500">{selection.product.shortName}</p>
                      <div className="flex items-center flex-wrap gap-2">
                        {selection.variant.ourPrice && (
                          <span className="text-lg font-bold">
                            ₹{Number(selection.variant.ourPrice).toLocaleString()}
                          </span>
                        )}
                        {selection.variant.mrp &&
                          Number(selection.variant.mrp) > Number(selection.variant.ourPrice) && (
                            <span className="text-sm text-gray-500 line-through">
                              MRP {Number(selection.variant.mrp).toLocaleString()}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                {searchTerm.trim()
                  ? 'No variants found or all matching variants are already featured.'
                  : 'Type to search for variants to add to featured list.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected featured variants */}
      <div>
        <h2 className="mb-4 text-lg font-medium">
          Current Featured Variants ({featuredVariants.length})
        </h2>
        {featuredVariants.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {featuredVariants.map((selection) => (
              <div key={selection.variantId} className="relative group">
                <div className="absolute right-3 top-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveVariant(selection.variantId);
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div>
                  <div className="mb-4 relative w-full aspect-square border group border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <Image
                        src={selection.variant.productImages?.[0] ?? '/placeholder.png'}
                        alt={selection.variant.name}
                        width={250}
                        height={250}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 duration-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                      {selection.variant.name}
                    </h3>
                    <p className="text-sm text-gray-500">{selection.product.shortName}</p>
                    <div className="flex items-center flex-wrap gap-2">
                      {selection.variant.ourPrice && (
                        <span className="text-lg font-bold">
                          ₹{Number(selection.variant.ourPrice).toLocaleString()}
                        </span>
                      )}
                      {selection.variant.mrp &&
                        Number(selection.variant.mrp) > Number(selection.variant.ourPrice) && (
                          <span className="text-sm text-gray-500 line-through">
                            MRP {Number(selection.variant.mrp).toLocaleString()}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No featured variants selected. Use the search above to add variants.</p>
          </div>
        )}
      </div>
    </div>
  );
}