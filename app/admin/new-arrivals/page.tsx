'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, Save, Check, X, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchProducts as fetchAllProducts, fetchNewArrivalsProducts } from '@/utils/products.util';
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

interface NewArrivalsSelection {
  productId: string;
  variantId: string;
  product: Product;
  variant: Variant;
  displayName: string; // Combined product + variant name
}

export default function NewArrivalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<NewArrivalsSelection[]>([]);
  const [newArrivalsVariants, setNewArrivalsVariants] = useState<NewArrivalsSelection[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const [products, newArrivals] = await Promise.all([
          fetchAllProducts(),
          fetchNewArrivalsProducts(),
        ]);

        setAllProducts(products || []);
        setNewArrivalsVariants(
          newArrivals?.map(({ productId, variantId, product, variant }: any) => ({
            productId,
            variantId,
            product,
            variant,
            displayName: `${product.shortName} - ${variant.name}`,
          })) || []
        );
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load products. Please try again.');
        alert('Failed to load products. Please try again.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, []);

  // Filter available variants
  const filteredVariants = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const newArrivalsVariantIds = new Set(newArrivalsVariants.map((v) => v.variantId));

    return allProducts
      .flatMap((product) =>
        product.variants.map((variant) => ({
          productId: product.id,
          variantId: variant.id,
          product,
          variant,
          displayName: `${product.fullName} - ${variant.name}`,
        }))
      )
      .filter((selection) => !newArrivalsVariantIds.has(selection.variantId))
      .filter((selection) =>
        [
          selection.displayName,
          selection.product.shortName,
          selection.product.fullName,
          selection.variant.name,
          selection.variant.id,
          selection.variant.sku,
          selection.product.description || '',
        ].some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [allProducts, newArrivalsVariants, searchTerm]);

  // Update search results
  useEffect(() => {
    setSearchResults(filteredVariants);
  }, [filteredVariants]);

  // Handle click outside
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

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setIsLoading(true);
    setShowResults(true);

    const timeout = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Handle variant selection
  const handleSelectVariant = useCallback(async (selection: NewArrivalsSelection) => {
    try {
      setNewArrivalsVariants((prev) => [...prev, selection]);
      setSearchResults((prev) => prev.filter((v) => v.variantId !== selection.variantId));
      setIsSaved(false);
      setSearchTerm('');
      setShowResults(false);
      alert('Variant added to New Arrivals');
    } catch (error) {
      console.error('Error selecting variant:', error);
      alert('Failed to add variant');
    }
  }, []);

  // Handle variant removal
  const handleRemoveVariant = useCallback(async (variantId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products/new-arrivals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });

      if (!res.ok) throw new Error('Failed to remove variant');

      setNewArrivalsVariants((prev) => prev.filter((v) => v.variantId !== variantId));
      setIsSaved(false);
      alert('Variant removed from New Arrivals');
    } catch (error) {
      console.error('Remove variant error:', error);
      alert('Failed to remove variant');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      const variantSelections = newArrivalsVariants.map(({ productId, variantId }) => ({
        productId,
        variantId,
      }));

      const response = await fetch('/api/products/new-arrivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantSelections }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save new arrivals variants');
      }

      setIsSaved(true);
      alert('New Arrivals variants saved successfully');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving new arrivals variants:', error);
      alert(error instanceof Error ? error.message : 'Failed to save new arrivals variants');
    } finally {
      setIsLoading(false);
    }
  }, [newArrivalsVariants]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setShowResults(false);
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
            New Arrivals variants saved successfully!
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsSaved(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search and save controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search variants by name, SKU, ID, or product details"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim()) setShowResults(true);
              }}
              className="pl-10 pr-10 py-6"
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
            disabled={newArrivalsVariants.length === 0 || isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            aria-label="Save new arrivals variants"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Search results */}
      {showResults && (
        <div ref={searchResultsRef} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Search Results {searchResults.length > 0 ? `(${searchResults.length})` : ''}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResults(false)}
              aria-label="Close search results"
            >
              Close
            </Button>
          </div>
          {isLoading ? (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Searching variants...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((selection) => (
                <VariantCard
                  key={selection.variantId}
                  selection={selection}
                  onSelect={(sel) => handleSelectVariant(sel as NewArrivalsSelection)}
                  actionLabel="Add"
                  actionVariant="secondary"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                {searchTerm.trim()
                  ? 'No variants found or all matching variants are already in New Arrivals.'
                  : 'Type to search for variants to add to New Arrivals.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Current New Arrivals variants */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Current New Arrivals Variants ({newArrivalsVariants.length})
        </h2>
        {newArrivalsVariants.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newArrivalsVariants.map((selection) => (
              <VariantCard
                key={selection.variantId}
                selection={selection}
                onSelect={(sel) => handleSelectVariant(sel as NewArrivalsSelection)}
                actionLabel="Remove"
                actionVariant="destructive"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">
              No variants in New Arrivals. Use the search above to add variants.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Variant Card Component
interface VariantCardProps {
  selection: NewArrivalsSelection;
  onSelect: (selection: NewArrivalsSelection | string) => void;
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