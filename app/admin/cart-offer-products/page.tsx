'use client';

import { useState, useEffect, ChangeEvent, DragEvent } from 'react';
import { Package, Plus, Minus, X, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type CartOfferProduct = {
  id: string;
  productName: string;
  productImage: string;
  range: string;
  ourPrice: string;
  quantity: number;
};

type CategorizedProducts = Record<string, CartOfferProduct[]>;

const range: Record<string, string> = {
  1000: 'Above ₹1,000',
  5000: 'Above ₹5,000',
  10000: 'Above ₹10,000',
  25000: 'Above ₹25,000',
};

const CATEGORIES: Record<string, string> = {
  1000: 'Above ₹1,000',
  5000: 'Above ₹5,000',
  10000: 'Above ₹10,000',
  25000: 'Above ₹25,000',
};

export default function CartOfferProductsPage() {
  const [categorizedProducts, setCategorizedProducts] = useState<CategorizedProducts>({
    1000: [],
    5000: [],
    10000: [],
    25000: [],
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    range: '',
    ourPrice: '',
    quantity: '1',
    productImage: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch cart offer products from backend
  useEffect(() => {
    const fetchCartOfferProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/cart/range-offers');
        if (!response.ok) throw new Error('Failed to fetch');
        const products: CartOfferProduct[] = await response.json();
        const categorized: CategorizedProducts = { 1000: [], 5000: [], 10000: [], 25000: [] };
        products.forEach((product) => {
          categorized[product.range].push({
            ...product,
            productImage: product.productImage,
          });
        });
        setCategorizedProducts(categorized);
      } catch (err) {
        setError('Failed to fetch cart offer products');
        console.error(err);
        toast.error('Failed to fetch cart offer products');
      } finally {
        setLoading(false);
      }
    };
    fetchCartOfferProducts();
  }, []);

  // Validate image dimensions
  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const isValid = img.width >= 300 && img.height >= 300;
        URL.revokeObjectURL(img.src);
        if (!isValid) {
          setImageError('Image must be at least 300x300px');
          resolve(false);
        } else {
          setImageError(null);
          resolve(true);
        }
      };
      img.onerror = () => {
        setImageError('Failed to load image for validation');
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
    });
  };

  // Handle image selection and preview
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        setImageError('Please upload a JPEG, PNG, or WebP image');
        return;
      }
      const isValid = await validateImage(file);
      if (isValid) {
        setFormData({ ...formData, productImage: file });
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setFormData({ ...formData, productImage: null });
      setImagePreview(null);
      setImageError(null);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        setImageError('Please upload a JPEG, PNG, or WebP image');
        return;
      }
      const isValid = await validateImage(file);
      if (isValid) {
        setFormData({ ...formData, productImage: file });
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  // Clean up image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleRemoveProduct = async (productId: string) => {
    if (!activeCategory) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/cart/range-offers/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      setCategorizedProducts((prev) => ({
        ...prev,
        [activeCategory]: prev[activeCategory].filter((p) => p.id !== productId),
      }));
      toast.success('Product removed!');
    } catch (err) {
      console.error(err);
      setError('Failed to remove product');
      toast.error('Failed to remove product');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.range || !formData.ourPrice || !formData.productImage) {
      toast.error('Please fill all required fields');
      return;
    }
    if (imageError) {
      toast.error('Please fix image errors');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('productName', formData.productName);
      form.append('range', formData.range);
      form.append('ourPrice', formData.ourPrice);
      form.append('quantity', formData.quantity);
      if (formData.productImage) {
        form.append('productImage', formData.productImage);
      }

      const response = await fetch('/api/cart/range-offers', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        throw new Error('Failed to create cart offer product');
      }

      const newProduct: CartOfferProduct = await response.json();
      setCategorizedProducts((prev) => ({
        ...prev,
        [formData.range]: [
          ...(prev[formData.range] || []),
          { ...newProduct, productImage: newProduct.productImage },
        ],
      }));

      toast.success('Cart offer product added!');
      setFormData({
        productName: '',
        range: '',
        ourPrice: '',
        quantity: '1',
        productImage: null,
      });
      setImagePreview(null);
      setImageError(null);
      setIsAddFormOpen(false);
    } catch (err) {
      console.error(err);
      setError('Failed to add cart offer product');
      toast.error('Failed to add cart offer product');
    } finally {
      setLoading(false);
    }
  };

  const toggleAddForm = () => {
    setIsAddFormOpen(!isAddFormOpen);
    if (isAddFormOpen) {
      setFormData({
        productName: '',
        range: '',
        ourPrice: '',
        quantity: '1',
        productImage: null,
      });
      setImagePreview(null);
      setImageError(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
      {/* Status Messages */}
      {loading && (
        <div className="mb-6 rounded-2xl bg-blue-50 p-4 text-blue-800 flex items-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading, please wait...
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-gray-900">Cart Offer Products</h1>
          <p className="mt-2 text-gray-600">Manage products for cart-based offers</p>
        </div>
        <Button
          onClick={toggleAddForm}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 px-6"
          aria-label={isAddFormOpen ? 'Hide add product form' : 'Add new product'}
        >
          {isAddFormOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isAddFormOpen ? 'Hide Form' : 'Add New Product'}
        </Button>
      </div>

      {/* Add Product Modal */}
      {isAddFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 w-full max-w-3xl max-h-[90dvh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Cart Offer Product</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAddForm}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleFormSubmit} className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="productName" className="text-sm font-medium text-gray-700">
                  Product Name
                </Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="Enter product name"
                  required
                  className="mt-1 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 text-base"
                  aria-required="true"
                />
              </div>
              <div>
                <Label htmlFor="range" className="text-sm font-medium text-gray-700">
                  Range
                </Label>
                <Select
                  value={formData.range}
                  onValueChange={(value) => setFormData({ ...formData, range: value })}
                >
                  <SelectTrigger className="mt-1 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 text-base">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(range).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ourPrice" className="text-sm font-medium text-gray-700">
                  Price (₹)
                </Label>
                <Input
                  id="ourPrice"
                  type="number"
                  step="0.01"
                  value={formData.ourPrice}
                  onChange={(e) => setFormData({ ...formData, ourPrice: e.target.value })}
                  placeholder="Enter price"
                  required
                  className="mt-1 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 text-base"
                  aria-required="true"
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                  required
                  className="mt-1 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 text-base"
                  aria-required="true"
                />
              </div>
              <div>
                <Label htmlFor="productImage" className="text-sm font-medium text-gray-700">
                  Product Image
                </Label>
                <div
                  className={cn(
                    'mt-1 border-2 border-dashed rounded-xl p-6 text-center transition-colors',
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    id="productImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-required="true"
                  />
                  {imagePreview ? (
                    <div className="relative w-48 h-48 mx-auto">
                      <Image
                        src={imagePreview}
                        alt="Product preview"
                        fill
                        className="object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, 192px"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData({ ...formData, productImage: null });
                          setImagePreview(null);
                          setImageError(null);
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700"
                        aria-label="Remove product image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">Optimized for 300x300px</p>
                    </div>
                  ) : (
                    <label
                      htmlFor="productImage"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600">Drag and drop an image here, or click to select</p>
                      <p className="text-xs text-gray-400 mt-1">Recommended: 300x300px</p>
                    </label>
                  )}
                  {imageError && <p className="text-sm text-red-600 mt-2">{imageError}</p>}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleAddForm}
                  className="rounded-lg border-gray-300 text-gray-600 hover:bg-gray-100"
                  aria-label="Cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                  disabled={loading || !!imageError}
                  aria-label="Add product"
                >
                  <Upload className="h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <div className="mb-8 bg-white rounded-2xl border border-gray-200 p-4" role="tablist" aria-label="Category navigation">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full">
          <Button
            variant={activeCategory === null ? 'default' : 'ghost'}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2',
              activeCategory === null ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-600 hover:bg-blue-50'
            )}
            onClick={() => setActiveCategory(null)}
            aria-selected={activeCategory === null}
            role="tab"
          >
            <Package className="h-4 w-4" />
            All
          </Button>
          {Object.entries(range).map(([apiKey, displayName]) => (
            <Button
              key={apiKey}
              variant={activeCategory === apiKey ? 'default' : 'ghost'}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2',
                activeCategory === apiKey ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-600 hover:bg-blue-50'
              )}
              onClick={() => setActiveCategory(activeCategory === apiKey ? null : apiKey)}
              aria-selected={activeCategory === apiKey}
              role="tab"
            >
              <Package className="h-4 w-4" />
              {displayName} ({categorizedProducts[apiKey]?.length || 0})
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Category Products */}
      {activeCategory && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-900">
              {CATEGORIES[activeCategory]} ({categorizedProducts[activeCategory].length})
            </h2>
          </div>
          {categorizedProducts[activeCategory].length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[320px]">
              {categorizedProducts[activeCategory].map((product, index) => (
                <div
                  key={product.id}
                  className={cn(
                    'group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:scale-[1.02] transition-all duration-300',
                  )}
                >
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 z-10"
                    aria-label={`Remove ${product.productName}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl overflow-hidden">
                    <Image
                      src={product.productImage ?? '/placeholder.png'}
                      alt={product.productName}
                      fill
                      className="object-cover group-hover:scale-105 group-hover:bg-black/10 transition-all duration-300"
                      sizes={index % 5 === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw'}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      <Package className="h-3 w-3" />
                      {CATEGORIES[product.range]}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{product.productName}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{Number(product.ourPrice).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Quantity: {product.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center min-h-[240px] flex items-center justify-center">
              <p className="text-gray-500">
                No products in {CATEGORIES[activeCategory]}. Click &ldquo;Add New Product&ldquo; to add one.
              </p>
            </div>
          )}
        </div>
      )}

      {/* All Categories Overview */}
      {!activeCategory && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-900">All Categories</h2>
          </div>
          <div className="space-y-12">
            {Object.entries(CATEGORIES).map(([apiKey, displayName]) => (
              <div key={apiKey}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-bold text-gray-900">
                      {displayName} ({categorizedProducts[apiKey]?.length || 0})
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setActiveCategory(apiKey)}
                    className="rounded-lg text-blue-600 border-blue-600 hover:bg-blue-50"
                    aria-label={`Manage products in ${displayName}`}
                  >
                    Manage Products
                  </Button>
                </div>
                {categorizedProducts[apiKey]?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[320px]">
                    {categorizedProducts[apiKey].slice(0, 4).map((product, index) => (
                      <div
                        key={product.id}
                        className={cn(
                          'group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:scale-[1.02] transition-all duration-300',
                         
                        )}
                      >
                        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl overflow-hidden">
                          <Image
                            src={product.productImage ?? '/placeholder.png'}
                            alt={product.productName}
                            fill
                            className="object-cover group-hover:scale-105 group-hover:bg-black/10 transition-all duration-300"
                            sizes={index % 5 === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw'}
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            <Package className="h-3 w-3" />
                            {CATEGORIES[product.range]}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{product.productName}</h3>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{Number(product.ourPrice).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">Quantity: {product.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {categorizedProducts[apiKey].length > 4 && (
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setActiveCategory(apiKey)}
                          className="h-full min-h-[320px] w-full border-dashed rounded-2xl text-blue-600 border-blue-600 hover:bg-blue-50"
                          aria-label={`View ${categorizedProducts[apiKey].length - 4} more products in ${displayName}`}
                        >
                          +{categorizedProducts[apiKey].length - 4} more products
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center min-h-[240px] flex items-center justify-center">
                    <p className="text-gray-500">No products in {displayName}.</p>
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