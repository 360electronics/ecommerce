"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import ProductCardwithoutCart from "@/components/Product/ProductCards/ProductCardwithoutCart"

// Interface for sub-product
interface SubProduct {
  id: string
  title: string
  image: string
  price: number
  mrp: number
  discount: number
  rating: number
}

// Sample product data for search
const availableProducts: SubProduct[] = [
  {
    id: "1",
    title: "Logitech G502 X Gaming Mouse (White)",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 4700,
    mrp: 5000,
    discount: 6,
    rating: 4.5,
  },
  {
    id: "2",
    title: "Logitech G502 X Gaming Mouse (Black)",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 4700,
    mrp: 5000,
    discount: 6,
    rating: 4.6,
  },
  {
    id: "3",
    title: "Logitech G502 X Gaming Mouse (RGB)",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 4700,
    mrp: 5000,
    discount: 6,
    rating: 4.7,
  },
  {
    id: "4",
    title: "Logitech G502 X Gaming Mouse (Wireless)",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 4700,
    mrp: 5000,
    discount: 6,
    rating: 4.8,
  },
  {
    id: "5",
    title: "Gaming Laptop",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 89999,
    mrp: 95000,
    discount: 5,
    rating: 4.9,
  },
  {
    id: "6",
    title: "Mechanical Keyboard",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 7999,
    mrp: 8500,
    discount: 6,
    rating: 4.7,
  },
  {
    id: "7",
    title: "27-inch Monitor",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 25999,
    mrp: 28000,
    discount: 7,
    rating: 4.8,
  },
  {
    id: "8",
    title: "Gaming Headset",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 10999,
    mrp: 12000,
    discount: 8,
    rating: 4.6,
  },
]

export function SubProductSelector() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SubProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SubProduct[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([])
      return
    }

    const filtered = availableProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedProducts.some((selected) => selected.id === product.id),
    )
    setSearchResults(filtered)
  }, [searchTerm, selectedProducts])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchTerm.trim() !== "") {
      setShowResults(true)
    }
  }

  // Handle product selection
  const handleSelectProduct = (product: SubProduct) => {
    setSelectedProducts((prev) => [...prev, product])
    setSearchTerm("")
    setShowResults(false)
  }

  // Handle product removal
  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== productId))
  }

  // Scroll horizontally with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div className="space-y-4">
      {/* Search input - with normal width */}
      <div className="relative max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Product"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              if (e.target.value.trim() !== "") {
                setShowResults(true)
              } else {
                setShowResults(false)
              }
            }}
            onFocus={handleSearchFocus}
            className="pl-10"
          />
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div
            ref={searchResultsRef}
            className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
          >
            <div className="max-h-60 overflow-auto py-1">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-md">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.title}</p>
                    <p className="text-xs text-gray-500">₹{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results message */}
        {showResults && searchTerm.trim() !== "" && searchResults.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 shadow-lg">
            <p className="text-center text-sm text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Selected products horizontal scroll - Fixed width for consistent card sizes */}
      {selectedProducts.length > 0 && (
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
          onWheel={handleWheel}
        >
          {selectedProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[300px]">
              <ProductCardwithoutCart
                image={product.image}
                title={product.title}
                rating={product.rating}
                price={product.price}
                mrp={product.mrp}
                discount={product.discount}
                showViewDetails={false}
                onRemove={() => handleRemoveProduct(product.id)}
                isHeartNeed={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
