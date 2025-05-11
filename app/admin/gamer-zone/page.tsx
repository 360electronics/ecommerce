"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, Save, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchGamersZoneProducts, fetchProducts } from "@/utils/products.util"
import { Product } from "@/types/product"
import Image from "next/image"


type CategorizedProducts = Record<string, Product[]>

const CATEGORIES: Record<string, string> = {
  consoles: "Consoles",
  accessories: "Accessories",
  laptops: "Laptops",
  "steering-chairs": "Steerings & Chairs",
}

export default function GamerZonePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categorizedProducts, setCategorizedProducts] = useState<CategorizedProducts>({
    consoles: [],
    accessories: [],
    laptops: [],
    "steering-chairs": [],
  })

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement | null>(null)

  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal

    const fetchAllData = async () => {
      setLoading(true)
      try {
        const productsData = await fetchProducts()
        if (productsData) setAllProducts(productsData)

        const gamersZoneData = await fetchGamersZoneProducts()
        if (gamersZoneData) {
          setCategorizedProducts(gamersZoneData)

          if (!activeCategory) {
            const categoryKeys = Object.keys(gamersZoneData) as Array<keyof typeof gamersZoneData>
            const firstNonEmpty = categoryKeys.find(
              (key) => gamersZoneData[key]?.length > 0
            )
            setActiveCategory(firstNonEmpty || "consoles")
          }

        }
      } catch (err: any) {
        if (!signal.aborted) {
          console.error("Error fetching data:", err)
          setError("Failed to load products. Please try again.")
        }
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    fetchAllData()
    return () => abortController.abort()
  }, [])

  const searchResults = useMemo(() => {
    if (!activeCategory || !searchTerm.trim()) return []

    const selectedIds = new Set(
      categorizedProducts[activeCategory]?.map((p) => p.id) || []
    )

    return allProducts
      .filter(
        (product) =>
          !selectedIds.has(product.id) &&
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 12)
  }, [activeCategory, categorizedProducts, searchTerm, allProducts])

  const selectedProducts = useMemo(() => {
    return activeCategory ? categorizedProducts[activeCategory] || [] : []
  }, [activeCategory, categorizedProducts])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectProduct = (product: Product) => {
    if (!activeCategory) return

    setCategorizedProducts((prev) => ({
      ...prev,
      [activeCategory]: [...prev[activeCategory], product],
    }))
    setSearchTerm("")
    setShowSearchResults(false)
  }

  const handleRemoveProduct = (productId: string) => {
    if (!activeCategory) return

    setCategorizedProducts((prev) => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter((p) => p.id !== productId),
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload = {
        categories: {} as Record<string, string[]>,
      }

      Object.keys(categorizedProducts).forEach((category) => {
        payload.categories[category] = categorizedProducts[category]
          .map((p) => p.id)
          .filter((id): id is string => typeof id === "string");
      });


      const response = await fetch("/api/products/gamers-zone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update gamers zone")
      }

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err: any) {
      console.error("Error saving gamers zone:", err)
      setError(err.message || "Failed to save changes")
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      {/* Loading indicator */}
      {loading && (
        <div className="mb-4 rounded-md bg-blue-50 p-4 text-blue-800">
          Loading, please wait...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Success message */}
      {isSaved && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800">
          Gamer Zone settings have been saved successfully!
        </div>
      )}

      {/* Search bar and save button */}
      <div className="mb-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeCategory ? `Search ${CATEGORIES[activeCategory] || activeCategory}...` : "Select a category first"}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowSearchResults(e.target.value.trim() !== "")
              }}
              onFocus={() => {
                if (searchTerm.trim() !== "") {
                  setShowSearchResults(true)
                }
              }}
              className="pl-10 py-4 text-lg"
              disabled={!activeCategory}
            />
          </div>

          <Button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Categories tab navigation */}
      <div className="relative mb-6">
        <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            className={`px-6 py-2 h-auto whitespace-nowrap ${activeCategory === null ? "bg-blue-600 text-white hover:bg-blue-700" : ""
              }`}
            onClick={() => {
              setActiveCategory(null)
              setSearchTerm("")
              setShowSearchResults(false)
            }}
          >
            All
          </Button>

          {Object.entries(CATEGORIES).map(([apiKey, displayName]) => (
            <Button
              key={apiKey}
              variant={activeCategory === apiKey ? "default" : "outline"}
              className={`px-6 py-2 h-auto whitespace-nowrap ${activeCategory === apiKey ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                }`}
              onClick={() => {
                setActiveCategory(activeCategory === apiKey ? null : apiKey)
                setSearchTerm("")
                setShowSearchResults(false)
              }}
            >
              {displayName} {categorizedProducts[apiKey]?.length > 0 && `(${categorizedProducts[apiKey].length})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {activeCategory && showSearchResults && searchTerm.trim() !== "" && (
        <div ref={searchResultsRef} className="mb-8">
          <h3 className="text-lg font-medium mb-4">Search Results</h3>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="relative cursor-pointer group"
                  onClick={() => handleSelectProduct(product)}
                >
                  {/* Selection indicator */}
                  <div className="absolute left-3 top-3 z-20">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-gray-300 group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:text-white">
                      <Check className="h-4 w-4 opacity-0 group-hover:opacity-100 text-white" />
                    </div>
                  </div>

                  <div>

                    <div className="mb-4 relative w-full aspect-square border group border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <Image
                          src={ product.productImages?.[0] ?? '/placeholder.png' }
                          alt={product.name}
                          width={250}
                          height={250}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-medium text-gray-900 line-clamp-2">{product.name}</h3>



                      {/* Price */}
                      <div className="flex items-center flex-wrap gap-2">
                        {product.ourPrice !== null && product.ourPrice !== undefined && (
                          <span className="text-lg font-bold">₹{product.ourPrice.toLocaleString()}</span>
                        )}
                        {product.mrp &&
                          Number(product.mrp) > 0 &&
                          product.ourPrice &&
                          Number(product.mrp) > Number(product.ourPrice) && (
                            <span className="text-sm text-gray-500 line-through">
                              MRP {Number(product.mrp).toLocaleString()}
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
                No more products available for this category or all matching products are already selected.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected products for active category */}
      {activeCategory && (
        <div>
          <h2 className="text-xl font-semibold mb-6">
            {CATEGORIES[activeCategory]} Products ({selectedProducts.length})
          </h2>

          {selectedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {selectedProducts.map((product) => (
                <div key={product.id}>
                  <div className=" relative">

                    <div onClick={() => handleRemoveProduct(product.id!)} className=" absolute cursor-pointer z-50 top-2 right-2 bg-white p-2 rounded-full">
                      <X size={16} className=" text-offer" />
                    </div>

                    <div className="mb-4 relative w-full aspect-square border group border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <Image
                          src={product.productImages?.[0] ?? '/placeholder.png' }
                          alt={product.name}
                          width={250}
                          height={250}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-medium text-gray-900 line-clamp-2">{product.name}</h3>



                      {/* Price */}
                      <div className="flex items-center flex-wrap gap-2">
                        {product.ourPrice !== null && product.ourPrice !== undefined && (
                          <span className="text-lg font-bold">₹{product.ourPrice.toLocaleString()}</span>
                        )}
                        {product.mrp &&
                          Number(product.mrp) > 0 &&
                          product.ourPrice &&
                          Number(product.mrp) > Number(product.ourPrice) && (
                            <span className="text-sm text-gray-500 line-through">
                              MRP {Number(product.mrp).toLocaleString()}
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
                No products selected for {CATEGORIES[activeCategory]}. Use the search above to add products.
              </p>
            </div>
          )}
        </div>
      )}

      {/* All categories overview when no specific category is selected */}
      {!activeCategory && (
        <div>
          <h2 className="text-xl font-semibold mb-6">All Categories</h2>

          <div className="space-y-8">
            {Object.entries(CATEGORIES).map(([apiKey, displayName]) => (
              <div key={apiKey}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">
                    {displayName} ({categorizedProducts[apiKey]?.length || 0})
                  </h3>
                  <Button variant="outline" onClick={() => setActiveCategory(apiKey)}>
                    Manage Products
                  </Button>
                </div>

                {categorizedProducts[apiKey]?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categorizedProducts[apiKey].slice(0, 4).map((product) => (
                      <div key={product.id}>
                        <div>

                          <div className="mb-4 relative w-full aspect-square border group border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center p-6">
                              <Image
                                src={product.productImages?.[0] ?? '/placeholder.png' }
                                alt={product.name}
                                width={250}
                                height={250}
                                className="max-h-full max-w-full object-contain group-hover:scale-105 duration-200"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-base font-medium text-gray-900 line-clamp-2">{product.name}</h3>



                            {/* Price */}
                            <div className="flex items-center flex-wrap gap-2">
                              {product.ourPrice !== null && product.ourPrice !== undefined && (
                                <span className="text-lg font-bold">₹{product.ourPrice.toLocaleString()}</span>
                              )}
                              {product.mrp &&
                                Number(product.mrp) > 0 &&
                                product.ourPrice &&
                                Number(product.mrp) > Number(product.ourPrice) && (
                                  <span className="text-sm text-gray-500 line-through">
                                    MRP {Number(product.mrp).toLocaleString()}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {categorizedProducts[apiKey].length > 4 && (
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setActiveCategory(apiKey)}
                          className="h-full min-h-[200px] w-full border-dashed"
                        >
                          +{categorizedProducts[apiKey].length - 4} more products
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-gray-500">No products selected for {displayName}.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}