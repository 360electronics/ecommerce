"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, Save, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ProductCardwithoutCart from "@/components/Product/ProductCards/ProductCardwithoutCart"
import { fetchProducts as fetchAllProducts, fetchFeaturedProducts } from "@/utils/products"
import { Product } from "@/types/product"

export default function FeaturedProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const products = await fetchAllProducts()
        const featured = await fetchFeaturedProducts()

        if (products) setAllProducts(products)
        if (featured) setFeaturedProducts(featured)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter available products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return []

    const featuredProductIds = featuredProducts.map(p => p.id)

    // Filter products that are not already featured
    return allProducts
      .filter(product => !featuredProductIds.includes(product.id))
      .filter(product =>
        product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(product?.id).includes(searchTerm)
      )
  }, [allProducts, featuredProducts, searchTerm])

  // Update search results when filtered products change
  useEffect(() => {
    setSearchResults(filteredProducts)
  }, [filteredProducts])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setIsLoading(true)
    setShowResults(true)

    // Simple debounce
    setTimeout(() => {
      setIsLoading(false)
    }, 300)
  }

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setFeaturedProducts(prev => [...prev, product])
    setSearchResults(prev => prev.filter(p => p.id !== product.id))
    setIsSaved(false)
    // Clear search after adding product
    setSearchTerm("")
    setShowResults(false)
  }

  // Handle product removal
  const handleRemoveProduct = async (productId: number) => {
    try {
      const res = await fetch('/api/products/featured', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) throw new Error('Failed to remove product');

      setFeaturedProducts(prev => prev.filter(product => product.id !== productId));
      setIsSaved(false);
    } catch (error) {
      console.error('Remove product error:', error);
    }
  };


  // Handle save
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Extract product IDs from featured products
      const productIds = featuredProducts.map(product => product.id);

      // Call the API to save featured products
      const response = await fetch('/api/products/featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save featured products');
      }

      // Show success message
      setIsSaved(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving featured products:", error);
      // Add better error handling here if needed
      alert(error instanceof Error ? error.message : "Failed to save featured products");
    } finally {
      setIsLoading(false);
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
    setShowResults(false)
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      {isSaved && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800 flex items-center justify-between">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            Featured products have been saved successfully!
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsSaved(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search and add products */}
      <div className="mb-8">
        <div className="relative flex flex-row items-center justify-between">
          <div className="relative w-full mr-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search products by name or ID"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim()) setShowResults(true)
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
            disabled={featuredProducts.length === 0}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Search results as product cards */}
      {showResults && (
        <div ref={searchResultsRef} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              Search Results {searchResults.length > 0 ? `(${searchResults.length})` : ""}
            </h3>
            {searchResults.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowResults(false)}>
                Close
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">Searching products...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="relative cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="absolute right-3 top-3 z-20">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectProduct(product)
                      }}
                    >
                      Add
                    </Button>
                  </div>

                  <ProductCardwithoutCart
                    image={product.productImages?.[0]}
                    name={product.name || "Untitled Product"}
                    rating={product.averageRating}
                    ourPrice={product.ourPrice !== null ? Number(product.ourPrice) : 0}
                    mrp={product.mrp ? Number(product.mrp) : undefined}
                    showViewDetails={false}
                    isHeartNeed={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                {searchTerm.trim() !== ""
                  ? "No products found or all matching products are already featured."
                  : "Type to search for products to add to featured list."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected featured products */}
      <div>
        <h2 className="mb-4 text-lg font-medium">Current Featured Products ({featuredProducts.length})</h2>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <div key={product.id} className="relative group">
                <div className="absolute right-3 top-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveProduct(product.id)
                    }}
                  >
                    Remove
                  </Button>
                </div>

                <ProductCardwithoutCart
                  image={product.productImages?.[0]}
                  name={product.name}
                  rating={product.averageRating}
                  ourPrice={product.ourPrice !== null ? Number(product.ourPrice) : 0}
                  mrp={product.mrp ? Number(product.mrp) : undefined}
                  showViewDetails={false}
                  onRemove={() => handleRemoveProduct(product.id)}
                  isHeartNeed={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No featured products selected. Use the search above to add products.</p>
          </div>
        )}
      </div>
    </div>
  )
}