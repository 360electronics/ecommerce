'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, Save, Check, X, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchProducts, fetchGamersZoneProducts } from '@/utils/products.util';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Types
interface Product {
  id: string;
  shortName: string;
  fullName: string;
  description: string | null;
  slug: string;
  variants: Variant[];
}

interface Variant {
  id: string;
  name: string;
  productImages: { url: string; alt: string; isFeatured: boolean; displayOrder: number }[];
  ourPrice: string;
  mrp: string;
  sku: string;
}

interface GamerZoneSelection {
  productId: string;
  variantId: string;
  product: Product;
  variant: Variant;
  displayName: string; // Combined product + variant name
  category: string;
}

type CategorizedVariants = Record<string, GamerZoneSelection[]>;

const CATEGORIES: Record<string, string> = {
  consoles: 'Consoles',
  accessories: 'Accessories',
  laptops: 'Laptops',
  'steering-chairs': 'Steerings & Chairs',
};

export default function GamerZonePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categorizedVariants, setCategorizedVariants] = useState<CategorizedVariants>({
    consoles: [],
    accessories: [],
    laptops: [],
    'steering-chairs': [],
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchAllData = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const [productsData, gamersZoneData] = await Promise.all([
          fetchProducts(),
          fetchGamersZoneProducts(),
        ]);

        setAllProducts(productsData || []);

        if (gamersZoneData) {
          const updatedVariants: CategorizedVariants = {
            consoles: [],
            accessories: [],
            laptops: [],
            'steering-chairs': [],
          };
          (Object.keys(gamersZoneData) as Array<keyof typeof gamersZoneData>).forEach((category) => {
            updatedVariants[category] = gamersZoneData[category]?.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              product: item.product,
              variant: item.variant,
              displayName: `${item.product.fullName} - ${item.variant.name}`,
              category,
            })) || [];
          });
          setCategorizedVariants(updatedVariants);

          if (!activeCategory) {
            const categoryKeys = Object.keys(gamersZoneData) as Array<keyof typeof gamersZoneData>;
            const firstNonEmpty = categoryKeys.find((key) => gamersZoneData[key]?.length > 0);
            setActiveCategory(firstNonEmpty || 'consoles');
          }
        }
      } catch (err: any) {
        if (!signal.aborted) {
          console.error('[FETCH_GAMERS_ZONE_ERROR]', err);
          setError('Failed to load data. Please try again.');
          alert('Failed to load data. Please try again.');
        }
      } finally {
        if (!signal.aborted) setIsFetching(false);
      }
    };

    fetchAllData();
    return () => abortController.abort();
  }, []);

  // Filter available variants
  const searchResults = useMemo(() => {
    if (!activeCategory || !searchTerm.trim()) return [];

    const selectedVariantIds = new Set(categorizedVariants[activeCategory]?.map((v) => v.variantId) || []);

    return allProducts
      .flatMap((product) =>
        product.variants.map((variant) => ({
          productId: product.id,
          variantId: variant.id,
          product,
          variant,
          displayName: `${product.fullName} - ${variant.name}`,
          category: activeCategory,
        }))
      )
      .filter(
        (selection) =>
          !selectedVariantIds.has(selection.variantId) &&
          [
            selection.displayName,
            selection.product.shortName,
            selection.product.fullName,
            selection.variant.name,
            selection.variant.id,
            selection.variant.sku,
            selection.product.description || '',
          ].some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .slice(0, 12);
  }, [activeCategory, categorizedVariants, searchTerm, allProducts]);

  const selectedVariants = useMemo(() => {
    return activeCategory ? categorizedVariants[activeCategory] || [] : [];
  }, [activeCategory, categorizedVariants]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setIsLoading(true);
    setShowSearchResults(true);

    const timeout = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Handle variant selection
  const handleSelectVariant = useCallback(
    async (selection: GamerZoneSelection) => {
      if (!activeCategory) return;

      try {
        setCategorizedVariants((prev) => ({
          ...prev,
          [activeCategory]: [...prev[activeCategory], selection],
        }));
        setSearchTerm('');
        setShowSearchResults(false);
        setIsSaved(false);
        alert(`Variant added to ${CATEGORIES[activeCategory]} in Gamer Zone`);
      } catch (error) {
        console.error('[SELECT_GAMER_ZONE_VARIANT_ERROR]', error);
        alert('Failed to add variant');
      }
    },
    [activeCategory]
  );

  // Handle variant removal
  const handleRemoveVariant = useCallback(
    async (variantId: string) => {
      if (!activeCategory) return;

      setIsLoading(true);
      try {
        const res = await fetch('/api/products/gamers-zone', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId, category: activeCategory }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to remove variant');
        }

        setCategorizedVariants((prev) => ({
          ...prev,
          [activeCategory]: prev[activeCategory].filter((v) => v.variantId !== variantId),
        }));
        setIsSaved(false);
        alert(`Variant removed from ${CATEGORIES[activeCategory]} in Gamer Zone`);
      } catch (error: any) {
        console.error('[DELETE_GAMER_ZONE_VARIANT_ERROR]', error);
        alert(error.message || 'Failed to remove variant');
      } finally {
        setIsLoading(false);
      }
    },
    [activeCategory]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = {
        categories: {} as Record<string, { productId: string; variantId: string }[]>,
      };

      Object.keys(categorizedVariants).forEach((category) => {
        payload.categories[category] = categorizedVariants[category].map((v) => ({
          productId: v.productId,
          variantId: v.variantId,
        }));
      });

      const response = await fetch('/api/products/gamers-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save Gamer Zone variants');
      }

      setIsSaved(true);
      alert('Gamer Zone variants saved successfully');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: any) {
      console.error('[SAVE_GAMERS_ZONE_ERROR]', error);
      setError(error.message || 'Failed to save changes');
      alert(error.message || 'Failed to save Gamer Zone variants');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [categorizedVariants]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setShowSearchResults(false);
  }, []);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Success message */}
      {isSaved && (
        <div className="mb-6 rounded-md bg-green-50 p-4 text-green-800 flex items-center justify-between">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            Gamer Zone variants saved successfully!
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsSaved(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search bar and save button */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={
                activeCategory
                  ? `Search ${CATEGORIES[activeCategory] || activeCategory} by name, SKU, ID, or product details`
                  : 'Select a category first'
              }
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim() && activeCategory) setShowSearchResults(true);
              }}
              className="pl-10 pr-10 py-6"
              disabled={!activeCategory}
              aria-label="Search variants"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            aria-label="Save Gamer Zone variants"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Categories tab navigation */}
      <div className="relative mb-6">
        <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <Button
            variant={activeCategory === null ? 'default' : 'outline'}
            className={`px-6 py-2 h-auto whitespace-nowrap ${
              activeCategory === null ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
            }`}
            onClick={() => {
              setActiveCategory(null);
              setSearchTerm('');
              setShowSearchResults(false);
            }}
          >
            All
          </Button>
          {Object.entries(CATEGORIES).map(([apiKey, displayName]) => (
            <Button
              key={apiKey}
              variant={activeCategory === apiKey ? 'default' : 'outline'}
              className={`px-6 py-2 h-auto whitespace-nowrap ${
                activeCategory === apiKey ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
              }`}
              onClick={() => {
                setActiveCategory(apiKey);
                setSearchTerm('');
                setShowSearchResults(false);
              }}
            >
              {displayName} ({categorizedVariants[apiKey]?.length || 0})
            </Button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {activeCategory && showSearchResults && searchTerm.trim() && (
        <div ref={searchResultsRef} className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Search Results ({searchResults.length})
          </h3>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((selection) => (
                <VariantCard
                  key={`${selection.productId}-${selection.variantId}`}
                  selection={selection}
                  onSelect={(sel) => handleSelectVariant(sel as GamerZoneSelection)}
                  actionLabel="Add"
                  actionVariant="secondary"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                No more variants available for {CATEGORIES[activeCategory]} or all matching variants are already selected.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected variants for active category */}
      {activeCategory && (
        <div>
          <h2 className="text-xl font-semibold mb-6">
            {CATEGORIES[activeCategory]} Variants ({selectedVariants.length})
          </h2>
          {selectedVariants.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {selectedVariants.map((selection) => (
                <VariantCard
                  key={`${selection.productId}-${selection.variantId}`}
                  selection={selection}
                  onSelect={(sel) => handleSelectVariant(sel as GamerZoneSelection)}
                  actionLabel="Remove"
                  actionVariant="destructive"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                No variants selected for {CATEGORIES[activeCategory]}. Use the search above to add variants.
              </p>
            </div>
          )}
        </div>
      )}

      {/* All categories overview */}
      {!activeCategory && (
        <div>
          <h2 className="text-xl font-semibold mb-6">All Categories</h2>
          <div className="space-y-8">
            {Object.entries(CATEGORIES).map(([apiKey, displayName]) => (
              <div key={apiKey}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {displayName} ({categorizedVariants[apiKey]?.length || 0})
                  </h3>
                  <Button variant="outline" onClick={() => setActiveCategory(apiKey)}>
                    Manage Variants
                  </Button>
                </div>
                {categorizedVariants[apiKey]?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categorizedVariants[apiKey].slice(0, 4).map((selection) => (
                      <VariantCard
                        key={`${selection.productId}-${selection.variantId}`}
                        selection={selection}
                        onSelect={(sel) => handleSelectVariant(sel as GamerZoneSelection)}
                        actionLabel="Remove"
                        actionVariant="destructive"
                      />
                    ))}
                    {categorizedVariants[apiKey].length > 4 && (
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setActiveCategory(apiKey)}
                          className="h-full min-h-[200px] w-full border-dashed"
                        >
                          +{categorizedVariants[apiKey].length - 4} more variants
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-gray-500">No variants selected for {displayName}.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Variant Card Component
interface VariantCardProps {
  selection: GamerZoneSelection;
  onSelect: (selection: GamerZoneSelection | string) => void;
  actionLabel: string;
  actionVariant: 'secondary' | 'destructive';
}

function VariantCard({ selection, onSelect, actionLabel, actionVariant }: VariantCardProps) {
  return (
    <div className="relative group transition-transform hover:scale-[1.02]">
      <div
        className={cn(
          'absolute right-3 top-3 z-20 transition-opacity',
          actionVariant === 'destructive' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        )}
      >
        <Button
          size="sm"
          variant={actionVariant}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(actionVariant === 'destructive' ? selection.variantId : selection);
          }}
          className={cn(
            actionVariant === 'secondary' && 'bg-blue-500 hover:bg-blue-600 text-white',
            actionVariant === 'destructive' && 'bg-red-500 hover:bg-red-600 text-white'
          )}
        >
          {actionLabel}
        </Button>
      </div>
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="relative w-full aspect-square bg-[#F4F4F4]">
          <Image
            src={selection.variant.productImages?.[0]?.url ?? '/placeholder.png'}
            alt={selection.displayName}
            fill
            className="object-contain p-6 group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-base font-medium line-clamp-2">{selection.displayName}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{selection.product.description || 'No description available'}</p>
          <div className="flex items-center gap-2">
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
  );
}