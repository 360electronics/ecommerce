"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Save, Check, X, AlertCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fetchProducts as fetchAllProducts,
  fetchNewArrivalsProducts,
} from "@/utils/products.util";
import { cn } from "@/lib/utils";
import { showFancyToast } from "@/components/Reusable/ShowCustomToast";

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
  productImages: {
    url: string;
    alt: string;
    isFeatured: boolean;
    displayOrder: number;
  }[];
  ourPrice: string;
  mrp: string;
  sku: string;
}

interface NewArrivalsSelection {
  productId: string;
  variantId: string;
  product: Product;
  variant: Variant;
  displayName: string;
}

export default function NewArrivalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<NewArrivalsSelection[]>(
    []
  );
  const [newArrivalsVariants, setNewArrivalsVariants] = useState<
    NewArrivalsSelection[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const [productsRes, newArrivalsRes] = await Promise.all([
          fetchAllProducts(),
          fetchNewArrivalsProducts(),
        ]);

        // Normalize both responses — handle both { data: [...] } and direct arrays safely
        const products = Array.isArray(productsRes?.data)
          ? productsRes.data
          : Array.isArray(productsRes)
          ? productsRes
          : [];

        const newArrivals = Array.isArray(newArrivalsRes?.data)
          ? newArrivalsRes.data
          : Array.isArray(newArrivalsRes)
          ? newArrivalsRes
          : [];

        setAllProducts(products);
        setNewArrivalsVariants(
          newArrivals.map(
            ({ productId, variantId, product, variant }: any) => ({
              productId,
              variantId,
              product,
              variant,
              displayName: `${product.shortName} - ${variant.name}`,
            })
          )
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load products. Please try again.");
        showFancyToast({
          title: "Sorry, there was an error",
          message: "Failed to load products. Please try again.",
          type: "error",
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, []);

  // Calculate average discount
  const avgDiscount = useMemo(() => {
    if (newArrivalsVariants.length === 0) return 0;
    const totalDiscount = newArrivalsVariants.reduce((sum, { variant }) => {
      const ourPrice = parseFloat(variant.ourPrice);
      const mrp = parseFloat(variant.mrp);
      if (mrp > ourPrice) {
        return sum + ((mrp - ourPrice) / mrp) * 100;
      }
      return sum;
    }, 0);
    return (totalDiscount / newArrivalsVariants.length).toFixed(1);
  }, [newArrivalsVariants]);

  // Filter available variants
  const filteredVariants = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const newArrivalsVariantIds = new Set(
      newArrivalsVariants.map((v) => v.variantId)
    );

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
          selection.product.description || "",
        ].some((field) =>
          field.toLowerCase().includes(searchTerm.toLowerCase())
        )
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search with debouncing
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setIsLoading(true);
    setShowResults(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handle variant selection
  const handleSelectVariant = useCallback(
    async (selection: NewArrivalsSelection) => {
      try {
        setNewArrivalsVariants((prev) => [...prev, selection]);
        setSearchResults((prev) =>
          prev.filter((v) => v.variantId !== selection.variantId)
        );
        setIsSaved(false);
        setSearchTerm("");
        setShowResults(false);
        showFancyToast({
          title: "Variant Added Successfully",
          message: "Variant added to New Arrivals",
          type: "success",
        });
      } catch (error) {
        console.error("Error selecting variant:", error);
        showFancyToast({
          title: "Sorry, there was an error",
          message: "Failed to add variant",
          type: "error",
        });
      }
    },
    []
  );

  // Handle variant removal
  const handleRemoveVariant = useCallback(async (variantId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products/new-arrivals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      if (!res.ok) throw new Error("Failed to remove variant");

      setNewArrivalsVariants((prev) =>
        prev.filter((v) => v.variantId !== variantId)
      );
      setIsSaved(false);
      showFancyToast({
        title: "Variant Removed Successfully",
        message: "Variant removed from New Arrivals",
        type: "success",
      });
    } catch (error) {
      console.error("Remove variant error:", error);
      showFancyToast({
        title: "Sorry, there was an error",
        message: "Failed to remove variant",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      const variantSelections = newArrivalsVariants.map(
        ({ productId, variantId }) => ({
          productId,
          variantId,
        })
      );

      const response = await fetch("/api/products/new-arrivals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantSelections }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to save New Arrivals variants"
        );
      }

      setIsSaved(true);
      showFancyToast({
        title: "New Arrivals variants saved successfully",
        message: "All variants have been saved",
        type: "success",
      });
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error saving New Arrivals variants:", error);

      showFancyToast({
        title: "Sorry, there was an error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save New Arrivals variants",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [newArrivalsVariants]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setShowResults(false);
    searchInputRef.current?.focus();
  }, []);

  if (isFetching) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">
              New Arrivals Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage featured variants for New Arrivals
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Variants
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {allProducts.reduce((sum, p) => sum + p.variants.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                New Arrivals Variants
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {newArrivalsVariants.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {isSaved && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800 flex items-center justify-between border border-green-200">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            New Arrivals variants saved successfully!
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSaved(false)}
            className="text-green-600 hover:text-green-800"
            aria-label="Dismiss success message"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search and Save Controls */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            ref={searchInputRef}
            placeholder="Search by name, SKU, ID, or description..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (searchTerm.trim()) setShowResults(true);
            }}
            className="pl-10 pr-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            aria-label="Search variants"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={newArrivalsVariants.length === 0 || isLoading}
          className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 px-6"
          aria-label="Save New Arrivals variants"
        >
          <Save className="h-5 w-5" />
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Search Results */}
      {showResults && (
        <div ref={searchResultsRef} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results{" "}
              {searchResults.length > 0 ? `(${searchResults.length})` : ""}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResults(false)}
              className="text-gray-600 hover:text-gray-800"
              aria-label="Close search results"
            >
              Close
            </Button>
          </div>
          {isLoading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Searching variants...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((selection) => (
                <VariantCard
                  key={selection.variantId}
                  selection={selection}
                  onSelect={(sel) =>
                    handleSelectVariant(sel as NewArrivalsSelection)
                  }
                  actionLabel="Add to New Arrivals"
                  actionVariant="secondary"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-500">
                {searchTerm.trim()
                  ? "No variants found or all matching variants are already in New Arrivals."
                  : "Type to search for variants to add to New Arrivals."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Current New Arrivals Variants */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Current New Arrivals Variants ({newArrivalsVariants.length})
        </h2>
        {newArrivalsVariants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newArrivalsVariants.map((selection) => (
              <VariantCard
                key={selection.variantId}
                selection={selection}
                onSelect={(sel) => handleRemoveVariant(sel as string)}
                actionLabel="Remove"
                actionVariant="destructive"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
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
  actionVariant: "secondary" | "destructive";
}

function VariantCard({
  selection,
  onSelect,
  actionLabel,
  actionVariant,
}: VariantCardProps) {
  const discount = useMemo(() => {
    const ourPrice = parseFloat(selection.variant.ourPrice);
    const mrp = parseFloat(selection.variant.mrp);
    if (mrp > ourPrice) {
      return (((mrp - ourPrice) / mrp) * 100).toFixed(0);
    }
    return null;
  }, [selection.variant]);

  return (
    <div className="relative group transition-transform hover:scale-[1.02] duration-200">
      <div
        className={cn(
          "absolute right-4 top-4 z-10 transition-opacity",
          actionVariant === "destructive"
            ? "opacity-0 group-hover:opacity-100"
            : "opacity-100"
        )}
      >
        <Button
          size="sm"
          variant={actionVariant}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(
              actionVariant === "destructive" ? selection.variantId : selection
            );
          }}
          className={cn(
            "rounded-lg",
            actionVariant === "secondary" &&
              "bg-blue-600 hover:bg-blue-700 text-black",
            actionVariant === "destructive" &&
              "bg-red-600 hover:bg-red-700 text-white"
          )}
          aria-label={actionLabel}
        >
          {actionLabel}
        </Button>
      </div>
      <div
        className="border border-gray-200 rounded-xl bg-white overflow-hidden cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(
              actionVariant === "destructive" ? selection.variantId : selection
            );
          }
        }}
      >
        <div className="relative w-full aspect-square bg-gray-50">
          <img
            src={
              selection.variant.productImages?.[0]?.url ?? "/placeholder.png"
            }
            alt={
              selection.variant.productImages?.[0]?.alt ?? selection.displayName
            }
            className="object-contain w-full h-full aspect-square p-6 group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {discount && (
            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
              {discount}% OFF
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
            {selection.displayName}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {selection.product.description || "No description available"}
          </p>
          <div className="flex items-center gap-2">
            {selection.variant.ourPrice && (
              <span className="text-lg font-bold text-gray-900">
                ₹{Number(selection.variant.ourPrice).toLocaleString("en-IN")}
              </span>
            )}
            {selection.variant.mrp &&
              Number(selection.variant.mrp) >
                Number(selection.variant.ourPrice) && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{Number(selection.variant.mrp).toLocaleString("en-IN")}
                </span>
              )}
          </div>
          <p className="text-xs text-gray-500">SKU: {selection.variant.sku}</p>
        </div>
      </div>
    </div>
  );
}
