'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import toast from 'react-hot-toast';

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

  // Fetch cart offer products from backend
  useEffect(() => {
    const fetchCartOfferProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/cart/offer-products');
        if (!response.ok) throw new Error('Failed to fetch');
        const products: CartOfferProduct[] = await response.json();
        const categorized: CategorizedProducts = { 1000: [], 5000: [], 10000: [], 25000: [] };
        products.forEach((product) => {
          categorized[product.range].push({
            ...product,
            productImage: product.productImage, // For compatibility with existing UI
          });
        });
        setCategorizedProducts(categorized);
      } catch (err) {
        setError('Failed to fetch cart offer products');
        console.log(err)
        toast.error('Failed to fetch cart offer products');
      } finally {
        setLoading(false);
      }
    };
    fetchCartOfferProducts();
  }, []);

  // Handle image selection and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFormData({ ...formData, productImage: file });
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
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
      const response = await fetch(`/api/cart/offer-products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      setCategorizedProducts((prev) => ({
        ...prev,
        [activeCategory]: prev[activeCategory].filter((p) => p.id !== productId),
      }));
      toast.success('Product removed!');
    } catch (err) {
      console.log(err)
      setError('Failed to remove product');
      toast.error('Failed to remove product');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const response = await fetch('/api/cart/offer-products', {
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
          { ...newProduct, productImages: [newProduct.productImage] },
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
      setIsAddFormOpen(false);
    } catch (err) {
      setError('Failed to add cart offer product');
      console.log(err)
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
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Status Messages */}
      {loading && (
        <div className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-800 flex items-center">
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
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {/* Header and Add Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cart Offer Products</h1>
        <Button
          onClick={toggleAddForm}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          {isAddFormOpen ? (
            <Minus className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          {isAddFormOpen ? 'Hide Form' : 'Add New Product'}
        </Button>
      </div>

      {/* Add Product Form (Collapsible) */}
      {isAddFormOpen && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Add New Cart Offer Product</h2>
          <form onSubmit={handleFormSubmit} className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="productName" className="text-sm font-medium">
                Product Name
              </Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="Enter product name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="range" className="text-sm font-medium">
                Range
              </Label>
              <Select
                value={formData.range}
                onValueChange={(value) => setFormData({ ...formData, range: value })}
              >
                <SelectTrigger className="mt-1">
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
              <Label htmlFor="ourPrice" className="text-sm font-medium">
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
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">
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
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="productImage" className="text-sm font-medium">
                Product Image
              </Label>
              <Input
                id="productImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
                className="mt-1"
              />
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Image Preview:</p>
                  <div className="relative w-32 h-32 mt-2">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="sm:col-span-2 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={toggleAddForm}
                className="text-gray-600 border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                disabled={loading}
              >
                <Upload className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Tab Navigation */}
      <div className="mb-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-gray-200">
          <Button
            variant={activeCategory === null ? 'default' : 'ghost'}
            className={`px-4 py-2 text-sm font-medium ${
              activeCategory === null
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {Object.entries(range).map(([apiKey, displayName]) => (
            <Button
              key={apiKey}
              variant={activeCategory === apiKey ? 'default' : 'ghost'}
              className={`px-4 py-2 text-sm font-medium ${
                activeCategory === apiKey
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveCategory(activeCategory === apiKey ? null : apiKey)}
            >
              {displayName} ({categorizedProducts[apiKey]?.length || 0})
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Products for Active Category */}
      {activeCategory && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">
            {CATEGORIES[activeCategory]} ({categorizedProducts[activeCategory].length})
          </h2>
          {categorizedProducts[activeCategory].length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categorizedProducts[activeCategory].map((product) => (
                <div
                  key={product.id}
                  className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-sm hover:bg-red-50"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                  <div className="relative w-full aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={product.productImage ?? '/placeholder.png'}
                      alt={product.productName}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                      {product.productName}
                    </h3>
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
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                No products in {CATEGORIES[activeCategory]}. Click &quot;Add New Product&quot; to add one.
              </p>
            </div>
          )}
        </div>
      )}

      {/* All Categories Overview */}
      {!activeCategory && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">All Categories</h2>
          <div className="space-y-12">
            {Object.entries(CATEGORIES).map(([apiKey, displayName]) => (
              <div key={apiKey}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium text-gray-900">
                    {displayName} ({categorizedProducts[apiKey]?.length || 0})
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setActiveCategory(apiKey)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    Manage Products
                  </Button>
                </div>
                {categorizedProducts[apiKey]?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categorizedProducts[apiKey].slice(0, 4).map((product) => (
                      <div
                        key={product.id}
                        className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      >
                        <div className="relative w-full aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                          <Image
                            src={product.productImage ?? '/placeholder.png'}
                            alt={product.productName}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                            {product.productName}
                          </h3>
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
                          className="h-full min-h-[200px] w-full border-dashed text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          +{categorizedProducts[apiKey].length - 4} more products
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
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