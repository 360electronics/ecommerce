"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Save, Check, X, AlertCircle, Gamepad2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchProducts, fetchGamersZoneProducts } from "@/utils/products.util";
import Image from "next/image";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

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

interface GamerZoneSelection {
  productId: string;
  variantId: string;
  product: Product;
  variant: Variant;
  displayName: string;
  category: string;
}

type CategorizedVariants = Record<string, GamerZoneSelection[]>;

const CATEGORIES: Record<string, string> = {
  consoles: "Consoles",
  accessories: "Accessories",
  laptops: "Laptops",
  "steering-chairs": "Steerings & Chairs",
};

export default function GamerZonePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categorizedVariants, setCategorizedVariants] =
    useState<CategorizedVariants>({
      consoles: [],
      accessories: [],
      laptops: [],
      "steering-chairs": [],
    });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchAllData = async () => {
      setIsFetching(true);
      setError(null);

      try {
        // Fetch both datasets concurrently
        const [productsRes, gamersZoneRes] = await Promise.all([
          fetchProducts(),
          fetchGamersZoneProducts(),
        ]);

        // ✅ Normalize product data
        const productsData = Array.isArray(productsRes?.data)
          ? productsRes.data
          : Array.isArray(productsRes)
          ? productsRes
          : [];

        // ✅ gamersZoneRes is already normalized from your util
        const gamersZoneData = gamersZoneRes || {
          consoles: [],
          accessories: [],
          laptops: [],
          "steering-chairs": [],
        };

        setAllProducts(productsData);

        // ✅ Build categorized variant state
        const updatedVariants: CategorizedVariants = {
          consoles: [],
          accessories: [],
          laptops: [],
          "steering-chairs": [],
        };

        (
          Object.keys(gamersZoneData) as Array<keyof typeof gamersZoneData>
        ).forEach((category) => {
          const items = Array.isArray(gamersZoneData[category])
            ? gamersZoneData[category]
            : [];

          updatedVariants[category] = items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            product: item.product,
            variant: item.variant,
            displayName: `${item.product.shortName} - ${item.variant.name}`,
            category,
          }));
        });

        setCategorizedVariants(updatedVariants);

        // ✅ Set default active category if none
        if (!activeCategory) {
          const categoryKeys = Object.keys(gamersZoneData) as Array<
            keyof typeof gamersZoneData
          >;
          const firstNonEmpty = categoryKeys.find(
            (key) => gamersZoneData[key]?.length > 0
          );
          setActiveCategory(firstNonEmpty || "consoles");
        }
      } catch (err: any) {
        if (!signal.aborted) {
          console.error("[FETCH_GAMERS_ZONE_ERROR]", err);
          setError("Failed to load data. Please try again.");
          toast.error("Failed to load data. Please try again.");
        }
      } finally {
        if (!signal.aborted) setIsFetching(false);
      }
    };

    fetchAllData();
    return () => abortController.abort();
  }, []);

  // Calculate total variants and active categories
  const totalVariants = useMemo(() => {
    return allProducts.reduce((sum, p) => sum + p.variants.length, 0);
  }, [allProducts]);

  const activeCategoriesCount = useMemo(() => {
    return Object.values(categorizedVariants).filter(
      (variants) => variants.length > 0
    ).length;
  }, [categorizedVariants]);

  // Filter search results
  const searchResults = useMemo(() => {
    if (!activeCategory || !searchTerm.trim()) return [];

    const selectedVariantIds = new Set(
      categorizedVariants[activeCategory]?.map((v) => v.variantId) || []
    );

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
            selection.product.description || "",
          ].some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search with debouncing
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setIsLoading(true);
    setShowSearchResults(true);

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
    async (selection: GamerZoneSelection) => {
      if (!activeCategory) return;

      try {
        setCategorizedVariants((prev) => ({
          ...prev,
          [activeCategory]: [...prev[activeCategory], selection],
        }));
        setSearchTerm("");
        setShowSearchResults(false);
        setIsSaved(false);
        toast.success(
          `Variant added to ${CATEGORIES[activeCategory]} in Gamer Zone`
        );
      } catch (error) {
        console.error("[SELECT_GAMER_ZONE_VARIANT_ERROR]", error);
        toast.error("Failed to add variant");
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
        const res = await fetch("/api/products/gamers-zone", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, category: activeCategory }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to remove variant");
        }

        setCategorizedVariants((prev) => ({
          ...prev,
          [activeCategory]: prev[activeCategory].filter(
            (v) => v.variantId !== variantId
          ),
        }));
        setIsSaved(false);
        toast.success(
          `Variant removed from ${CATEGORIES[activeCategory]} in Gamer Zone`
        );
      } catch (error: any) {
        console.error("[DELETE_GAMER_ZONE_VARIANT_ERROR]", error);
        toast.error(error.message || "Failed to remove variant");
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
        categories: {} as Record<
          string,
          { productId: string; variantId: string }[]
        >,
      };

      Object.keys(categorizedVariants).forEach((category) => {
        payload.categories[category] = categorizedVariants[category].map(
          (v) => ({
            productId: v.productId,
            variantId: v.variantId,
          })
        );
      });

      const response = await fetch("/api/products/gamers-zone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to save Gamer Zone variants"
        );
      }

      setIsSaved(true);
      toast.success("Gamer Zone variants saved successfully");
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: any) {
      console.error("[SAVE_GAMERS_ZONE_ERROR]", error);
      setError(error.message || "Failed to save changes");
      toast.error(error.message || "Failed to save Gamer Zone variants");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [categorizedVariants]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setShowSearchResults(false);
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
    <div className="mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Gamer Zone Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage categorized variants for Gamer Zone
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Variants
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalVariants}
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
                Gamer Zone Variants
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(categorizedVariants).reduce(
                  (sum, arr) => sum + arr.length,
                  0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Categories
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeCategoriesCount}
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
            Gamer Zone variants saved successfully!
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
            placeholder={
              activeCategory
                ? `Search ${
                    CATEGORIES[activeCategory] || activeCategory
                  } by name, SKU, ID, or description...`
                : "Select a category first"
            }
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (searchTerm.trim() && activeCategory)
                setShowSearchResults(true);
            }}
            className="pl-10 pr-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            disabled={!activeCategory}
            aria-label="Search variants"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 px-6"
          aria-label="Save Gamer Zone variants"
        >
          <Save className="h-5 w-5" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Categories Tab Navigation */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            className={cn(
              "px-6 py-2 h-auto font-medium rounded-lg",
              activeCategory === null
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
            onClick={() => {
              setActiveCategory(null);
              setSearchTerm("");
              setShowSearchResults(false);
            }}
            aria-label="View all categories"
          >
            All
          </Button>
          {Object.entries(CATEGORIES).map(([apiKey, displayName]) => (
            <Button
              key={apiKey}
              variant={activeCategory === apiKey ? "default" : "outline"}
              className={cn(
                "px-6 py-2 h-auto font-medium rounded-lg",
                activeCategory === apiKey
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
              onClick={() => {
                setActiveCategory(apiKey);
                setSearchTerm("");
                setShowSearchResults(false);
              }}
              aria-label={`View ${displayName} category`}
            >
              {displayName} ({categorizedVariants[apiKey]?.length || 0})
            </Button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {activeCategory && showSearchResults && searchTerm.trim() && (
        <div ref={searchResultsRef} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearchResults(false)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((selection) => (
                <VariantCard
                  key={`${selection.productId}-${selection.variantId}`}
                  selection={selection}
                  onSelect={(sel) =>
                    handleSelectVariant(sel as GamerZoneSelection)
                  }
                  actionLabel={`Add to ${CATEGORIES[activeCategory]}`}
                  actionVariant="secondary"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-500">
                No more variants available for {CATEGORIES[activeCategory]} or
                all matching variants are already selected.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Variants for Active Category */}
      {activeCategory && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {CATEGORIES[activeCategory]} Variants ({selectedVariants.length})
          </h2>
          {selectedVariants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedVariants.map((selection) => (
                <VariantCard
                  key={`${selection.productId}-${selection.variantId}`}
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
                No variants selected for {CATEGORIES[activeCategory]}. Use the
                search above to add variants.
              </p>
            </div>
          )}
        </div>
      )}

      {/* All Categories Overview */}
      {!activeCategory && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Categories
          </h2>
          <div className="space-y-8">
            {Object.entries(CATEGORIES).map(([apiKey, displayName]) => (
              <div key={apiKey}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    {displayName} ({categorizedVariants[apiKey]?.length || 0})
                  </h3>
                  <Button
                    variant="outline"
                    className="rounded-lg border-gray-300 text-gray-600 hover:bg-gray-100"
                    onClick={() => setActiveCategory(apiKey)}
                    aria-label={`Manage ${displayName} variants`}
                  >
                    Manage Variants
                  </Button>
                </div>
                {categorizedVariants[apiKey]?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categorizedVariants[apiKey]
                      .slice(0, 4)
                      .map((selection) => (
                        <VariantCard
                          key={`${selection.productId}-${selection.variantId}`}
                          selection={selection}
                          onSelect={(sel) => handleRemoveVariant(sel as string)}
                          actionLabel="Remove"
                          actionVariant="destructive"
                        />
                      ))}
                    {categorizedVariants[apiKey].length > 4 && (
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setActiveCategory(apiKey)}
                          className="h-full min-h-[200px] w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg"
                          aria-label={`View more ${displayName} variants`}
                        >
                          +{categorizedVariants[apiKey].length - 4} more
                          variants
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                    <p className="text-gray-500">
                      No variants selected for {displayName}.
                    </p>
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
