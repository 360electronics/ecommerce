"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, Save, Check, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ProductCardwithoutCart from "@/components/ProductCards/ProductCardwithoutCart"

// Interface for product
interface Product {
  id: string
  title: string
  image: string
  price: number
  mrp: number
  discount: number
  rating: number
  addedDate?: string
  isSelected?: boolean
}

// Sample product data
const allProducts: Product[] = [
  {
    id: "1",
    title: "Logitech G502 X Gaming Mouse (White)",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 4700,
    mrp: 5000,
    discount: 30,
    rating: 4.0,
  },
  {
    id: "2",
    title: "Samsung Galaxy Book5 360",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 89999,
    mrp: 129999,
    discount: 30,
    rating: 4.0,
  },
  {
    id: "3",
    title: "ASUS TUF Gaming Laptop",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 79999,
    mrp: 99999,
    discount: 20,
    rating: 4.5,
  },
  {
    id: "4",
    title: "Apple MacBook Pro M3",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 149999,
    mrp: 169999,
    discount: 12,
    rating: 4.8,
  },
  {
    id: "5",
    title: "Sony WH-1000XM5 Headphones",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 24999,
    mrp: 34999,
    discount: 28,
    rating: 4.7,
  },
  {
    id: "6",
    title: "Dell XPS 15 Laptop",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 129999,
    mrp: 149999,
    discount: 13,
    rating: 4.6,
  },
  {
    id: "7",
    title: "Razer Basilisk V3 Gaming Mouse",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 5999,
    mrp: 7999,
    discount: 25,
    rating: 4.4,
  },
  {
    id: "8",
    title: "LG 27-inch UltraGear Gaming Monitor",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 29999,
    mrp: 39999,
    discount: 25,
    rating: 4.3,
  },
]

export default function NewArrivalsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)

  // Initialize with some new arrivals
  useEffect(() => {
    // Simulate fetching new arrivals from API
    const initialArrivals = allProducts.slice(3, 6).map((product) => ({
      ...product,
      addedDate: new Date().toISOString().split("T")[0],
    }))
    setNewArrivals(initialArrivals)
  }, [])

  // Get available products (products not already in new arrivals)
  const availableProducts = useMemo(() => {
    const newArrivalIds = newArrivals.map((p) => p.id)
    return allProducts
      .filter((product) => !newArrivalIds.includes(product.id))
      .filter((product) => product.title.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [newArrivals, searchTerm])

  // Update search results when available products change
  useEffect(() => {
    setSearchResults(availableProducts.map((product) => ({ ...product, isSelected: false })))
  }, [availableProducts])

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

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    const today = new Date().toISOString().split("T")[0]
    setNewArrivals((prev) => [...prev, { ...product, addedDate: today }])
    setSearchResults((prev) => prev.filter((p) => p.id !== product.id))
    setIsSaved(false)
  }

  // Toggle product selection in search results
  const toggleProductSelection = (productId: string) => {
    setSearchResults((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, isSelected: !product.isSelected } : product)),
    )
  }

  // Handle product removal
  const handleRemoveProduct = (productId: string) => {
    setNewArrivals((prev) => prev.filter((product) => product.id !== productId))
    setIsSaved(false)
  }

  // Handle save
  const handleSave = () => {
    // Here you would typically save to your backend
    console.log("Saving new arrivals:", newArrivals)
    setIsSaved(true)

    // Show success message briefly
    setTimeout(() => {
      setIsSaved(false)
    }, 3000)
  }

  return (
    <div className="container mx-auto py-8">


      {isSaved && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800">New arrivals have been saved successfully!</div>
      )}

      {/* Search and add products */}
      <div className="mb-8">
        {/* <h2 className="mb-4 text-lg font-medium">Add New Arrivals</h2> */}
        <div className="relative max-w-full flex flex-row items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Product Name"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                if (e.target.value.trim() !== "") {
                  setShowResults(true)
                } else {
                  setShowResults(false)
                }
              }}
              onFocus={() => {
                if (searchTerm.trim() !== "") {
                  setShowResults(true)
                }
              }}
              className="pl-10 py-4"
            />
          </div>

          <Button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="h-4 w-4" />
         
        </Button>
        </div>
      </div>

      {/* Search results as product cards */}
      {showResults && searchTerm.trim() !== "" && (
        <div ref={searchResultsRef} className="mb-8">
          <h3 className="text-lg font-medium mb-4">Search Results</h3>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {searchResults.map((product) => (
                <div key={product.id} className="relative cursor-pointer" onClick={() => handleSelectProduct(product)}>
                  {/* Selectable checkbox */}
                  <div className="absolute left-3 top-3 z-20">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${
                        product.isSelected ? "bg-blue-500" : "bg-white border border-gray-300"
                      } text-white`}
                    >
                      {product.isSelected && <Check className="h-4 w-4" />}
                    </div>
                  </div>

                  <ProductCardwithoutCart
                    image={product.image}
                    title={product.title}
                    rating={product.rating}
                    price={product.price}
                    mrp={product.mrp}
                    discount={product.discount}
                    showViewDetails={false}
                    isHeartNeed={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">No products found or all matching products are already added.</p>
            </div>
          )}
        </div>
      )}

      {/* Selected new arrivals */}
      <div>
        <h2 className="mb-4 text-lg font-medium">Current New Arrivals ({newArrivals.length})</h2>
        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {newArrivals.map((product) => (
              <div key={product.id} className="relative">
                
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
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No new arrivals selected. Use the search above to add products.</p>
          </div>
        )}
      </div>
    </div>
  )
}
