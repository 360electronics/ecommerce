"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, Plus, Save, X, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ProductCardwithoutCart from "@/components/ProductCards/ProductCardwithoutCart"

// Interfaces
interface Product {
  id: string
  title: string
  image: string
  price: number
  mrp: number
  discount: number
  rating: number
  category: string
  isSelected?: boolean
}

interface CategoryWithProducts {
  id: string
  name: string
  products: Product[]
}

// Sample product data
const allProducts: Product[] = [
  // Laptops
  {
    id: "l1",
    title: "ASUS TUF Gaming Laptop",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 79999,
    mrp: 99999,
    discount: 20,
    rating: 4.5,
    category: "Laptops",
  },
  {
    id: "l2",
    title: "MSI Raider Gaming Laptop",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 149999,
    mrp: 169999,
    discount: 12,
    rating: 4.7,
    category: "Laptops",
  },
  {
    id: "l3",
    title: "Alienware m18 Gaming Laptop",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 229999,
    mrp: 249999,
    discount: 8,
    rating: 4.9,
    category: "Laptops",
  },
  {
    id: "l4",
    title: "Lenovo Legion Pro Gaming Laptop",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 129999,
    mrp: 149999,
    discount: 13,
    rating: 4.6,
    category: "Laptops",
  },

  // Headphones
  {
    id: "h1",
    title: "HyperX Cloud Alpha Gaming Headset",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 8999,
    mrp: 10999,
    discount: 18,
    rating: 4.6,
    category: "Headphones",
  },
  {
    id: "h2",
    title: "Razer BlackShark V2 Pro",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 14999,
    mrp: 17999,
    discount: 17,
    rating: 4.7,
    category: "Headphones",
  },
  {
    id: "h3",
    title: "SteelSeries Arctis Nova Pro",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 24999,
    mrp: 29999,
    discount: 17,
    rating: 4.8,
    category: "Headphones",
  },

  // Steering Wheels
  {
    id: "s1",
    title: "Logitech G29 Driving Force Racing Wheel",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 29999,
    mrp: 38999,
    discount: 23,
    rating: 4.7,
    category: "Steering Wheels",
  },
  {
    id: "s2",
    title: "Thrustmaster T300 RS GT Racing Wheel",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 39999,
    mrp: 45999,
    discount: 13,
    rating: 4.8,
    category: "Steering Wheels",
  },

  // Mice
  {
    id: "m1",
    title: "Logitech G502 X Gaming Mouse",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 4700,
    mrp: 5999,
    discount: 22,
    rating: 4.8,
    category: "Mice",
  },
  {
    id: "m2",
    title: "Razer DeathAdder V3 Pro",
    image:
      "https://img.freepik.com/free-psd/hard-drive-isolated-transparent-background_191095-23920.jpg?t=st=1745827039~exp=1745830639~hmac=582c40c7a1b07c2aa2e83adb2b4de045040b904c86be933082a07effa2e3ebcd&w=900",
    price: 12999,
    mrp: 15999,
    discount: 19,
    rating: 4.9,
    category: "Mice",
  },
]

// Initial categories with empty product arrays
const initialCategories: CategoryWithProducts[] = [
  { id: "cat1", name: "Laptops", products: [] },
  { id: "cat2", name: "Headphones", products: [] },
  { id: "cat3", name: "Steering Wheels", products: [] },
  { id: "cat4", name: "Mice", products: [] },
]

export default function GamerZonePage() {
  // State for categories and their selected products
  const [categories, setCategories] = useState<CategoryWithProducts[]>(initialCategories)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // State for search
  const [searchTerm, setSearchTerm] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const newCategoryInputRef = useRef<HTMLInputElement>(null)
  const [searchResults, setSearchResults] = useState<Product[]>([])

  // State for save notification
  const [isSaved, setIsSaved] = useState(false)

  // Focus the new category input when it appears
  useEffect(() => {
    if (isAddingCategory && newCategoryInputRef.current) {
      newCategoryInputRef.current.focus()
    }
  }, [isAddingCategory])

  // Get available products (products not already selected in the active category)
  const availableProducts = useMemo(() => {
    if (!activeCategory) return []

    const activeCategoryObj = categories.find((cat) => cat.name === activeCategory)
    if (!activeCategoryObj) return []

    const selectedProductIds = activeCategoryObj.products.map((p) => p.id)

    return allProducts
      .filter((product) => !selectedProductIds.includes(product.id))
      .filter((product) => product.title.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [activeCategory, categories, searchTerm])

  // Update search results when available products change
  useEffect(() => {
    setSearchResults(availableProducts.map((product) => ({ ...product, isSelected: false })))
  }, [availableProducts])

  // Get selected products for the active category
  const selectedProducts = useMemo(() => {
    if (!activeCategory) return []

    const activeCategoryObj = categories.find((cat) => cat.name === activeCategory)
    return activeCategoryObj ? activeCategoryObj.products : []
  }, [activeCategory, categories])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle adding a new category
  const handleAddCategory = () => {
    if (newCategoryName.trim() === "") return

    const newCategory: CategoryWithProducts = {
      id: `cat${Date.now()}`,
      name: newCategoryName.trim(),
      products: [],
    }

    setCategories([...categories, newCategory])
    setNewCategoryName("")
    setIsAddingCategory(false)
    setActiveCategory(newCategory.name)
  }

  // Handle selecting a product for the active category
  const handleSelectProduct = (product: Product) => {
    if (!activeCategory) return

    setCategories(
      categories.map((category) =>
        category.name === activeCategory ? { ...category, products: [...category.products, product] } : category,
      ),
    )

    // Remove the product from search results
    setSearchResults((prev) => prev.filter((p) => p.id !== product.id))
  }

  // Toggle product selection in search results
  const toggleProductSelection = (productId: string) => {
    setSearchResults((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, isSelected: !product.isSelected } : product)),
    )
  }

  // Handle removing a product from a category
  const handleRemoveProduct = (productId: string) => {
    if (!activeCategory) return

    setCategories(
      categories.map((category) =>
        category.name === activeCategory
          ? { ...category, products: category.products.filter((p) => p.id !== productId) }
          : category,
      ),
    )
  }

  // Handle saving changes
  const handleSave = () => {
    // Here you would typically save to your backend
    console.log("Saving gamer zone categories:", categories)
    setIsSaved(true)

    // Show success message briefly
    setTimeout(() => {
      setIsSaved(false)
    }, 3000)
  }

  return (
    <div className="container mx-auto py-8">
     

      {isSaved && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800">
          Gamer Zone settings have been saved successfully!
        </div>
      )}

      {/* Global search - moved above categories */}
      {activeCategory && (
        <div className="mb-6">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeCategory}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (e.target.value.trim() !== "") {
                    setShowSearchResults(true)
                  } else {
                    setShowSearchResults(false)
                  }
                }}
                onFocus={() => {
                  setShowSearchResults(true)
                }}
                className="pl-10 py-4 text-lg"
              />
            </div>

            <Button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="h-4 w-4" />
   
        </Button>
          </div>
        </div>
      )}

      {/* Categories row with fixed height and better scrolling */}
      <div className="relative mb-6">
        <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            className={`px-6 py-2 h-auto whitespace-nowrap ${
              activeCategory === null ? "bg-blue-600 text-white hover:bg-blue-700" : ""
            }`}
            onClick={() => {
              setActiveCategory(null)
              setSearchTerm("")
              setShowSearchResults(false)
            }}
          >
            All
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.name ? "default" : "outline"}
              className={`px-6 py-2 h-auto whitespace-nowrap ${
                activeCategory === category.name ? "bg-blue-600 text-white hover:bg-blue-700" : ""
              }`}
              onClick={() => {
                setActiveCategory(activeCategory === category.name ? null : category.name)
                setSearchTerm("")
                setShowSearchResults(false)
              }}
            >
              {category.name} {category.products.length > 0 && `(${category.products.length})`}
            </Button>
          ))}

          {/* Add New Category - Fixed positioning */}
          {isAddingCategory ? (
            <div className="flex items-center space-x-2 min-w-[300px] z-10 bg-white p-1 rounded-md shadow-sm">
              <Input
                ref={newCategoryInputRef}
                placeholder="New category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full outline-0 focus:outline-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory()
                }}
              />
              <Button
                onClick={handleAddCategory}
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                Add
              </Button>
              <Button
                variant="default"
                onClick={() => setIsAddingCategory(false)}
                className="p-1 bg-white text-red-500 border border-red-500 hover:bg-red-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
              onClick={() => setIsAddingCategory(true)}
            >
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          )}
        </div>
      </div>

      {/* Search results as product cards */}
      {activeCategory && showSearchResults && searchTerm.trim() !== "" && (
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
            {activeCategory} Products ({selectedProducts.length})
          </h2>

          {selectedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {selectedProducts.map((product) => (
                <div key={product.id}>

                  
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
              <p className="text-gray-500">
                No products selected for {activeCategory}. Use the search above to add products.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Show all categories overview when no category is selected */}
      {!activeCategory && (
        <div>
          <h2 className="text-xl font-semibold mb-6">All Categories</h2>

          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category.id}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">
                    {category.name} ({category.products.length})
                  </h3>
                  <Button variant="outline" onClick={() => setActiveCategory(category.name)}>
                    Manage Products
                  </Button>
                </div>

                {category.products.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {category.products.slice(0, 4).map((product) => (
                      <div key={product.id}>
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
                    {category.products.length > 4 && (
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setActiveCategory(category.name)}
                          className="h-full min-h-[200px] w-full border-dashed"
                        >
                          +{category.products.length - 4} more products
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-gray-500">No products selected for {category.name}.</p>
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
