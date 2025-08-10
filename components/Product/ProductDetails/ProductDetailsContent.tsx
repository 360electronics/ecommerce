'use client';
import { Heart, Minus, Plus, Share2, Truck, Shield, Package, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { addToWishlist, removeFromWishlist } from '@/utils/wishlist.utils';
import { useProfileStore } from '@/store/profile-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useProductStore } from '@/store/product-store';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { ProductVariant, FlattenedProduct } from '@/types/product';
import { refetchCart, refetchWishlist } from '@/app/provider';

interface ProductDetailsContentProps {
  className?: string;
  activeVariant: ProductVariant;
}

export default function ProductDetailsContent({ className, activeVariant }: ProductDetailsContentProps) {
  const {
    product,
    selectedAttributes,
    setSelectedAttributes,
    quantity,
    setQuantity,
    handleBuyNow,
    setProduct,
  } = useProductStore();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isInWishlist, fetchWishlist } = useWishlistStore();
  const { refetch: refetchProfile } = useProfileStore();
  const { addToCart } = useCartStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);
  const [pinCodeError, setPinCodeError] = useState<string | null>(null);
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const userId = user?.id;

  // Load location from localStorage and set initial delivery estimate
  useEffect(() => {
    const savedLocation = localStorage.getItem('g36-location');
    if (savedLocation) {
      const { pincode, location, district } = JSON.parse(savedLocation);
      if (pincode) {
        setPinCode(pincode);
        calculateDeliveryEstimate(pincode, location, district);
      }
    }
  }, []);

  // Debounce function to limit rapid API calls
  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Calculate delivery estimate based on PIN code, stock, and backorder status
  const calculateDeliveryEstimate = useCallback(
    debounce((pin: string, location?: string, district?: string) => {
      if (!/^\d{6}$/.test(pin)) {
        setPinCodeError('Please enter a valid 6-digit PIN code');
        setDeliveryEstimate(null);
        setIsCheckingPin(false);
        return;
      }

      setPinCodeError(null);
      setIsCheckingPin(true);

      // Simulate API call for delivery estimation
      setTimeout(() => {
        try {
          const firstDigit = parseInt(pin[0]);
          const today = new Date();
          let deliveryDays = 4; // Default: 2-5 days

          // Adjust delivery days based on region
          if ([1, 2].includes(firstDigit)) {
            deliveryDays = 5; // North India
          } else if ([7, 8].includes(firstDigit)) {
            deliveryDays = 7; // Northeast or remote areas
          } else if ([3, 4].includes(firstDigit)) {
            deliveryDays = 3; // Central/West India
          } else if ([5, 6].includes(firstDigit)) {
            deliveryDays = 4; // South India
          }

          // Adjust delivery days based on stock availability
          if (activeVariant.stock <= (activeVariant.lowStockThreshold ?? 10)) {
            deliveryDays += 2; // Add delay for low stock
          }
          if (!activeVariant.stock && activeVariant.isBackorderable) {
            deliveryDays += 5; // Additional delay for backordered items
          }

          // Calculate min and max delivery dates
          const minDeliveryDate = new Date(today);
          minDeliveryDate.setDate(today.getDate() + deliveryDays - 1);
          const maxDeliveryDate = new Date(today);
          maxDeliveryDate.setDate(today.getDate() + deliveryDays + 1);

          const formatDate = (date: Date) =>
            date.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });

          const locationText = district ? `${district}` : pin;
          const estimateText = activeVariant.stock > 0
            ? `Estimated delivery between ${formatDate(minDeliveryDate)} and ${formatDate(maxDeliveryDate)} for ${locationText}`
            : activeVariant.isBackorderable
            ? `Estimated delivery between ${formatDate(minDeliveryDate)} and ${formatDate(maxDeliveryDate)} for ${locationText} (Backordered)`
            : `Currently unavailable for delivery to ${locationText}`;

          setDeliveryEstimate(estimateText);
          setIsCheckingPin(false);
        } catch (error) {
          setPinCodeError('Error calculating delivery estimate. Please try again.');
          setDeliveryEstimate(null);
          setIsCheckingPin(false);
        }
      }, 800); // Increased delay to simulate more realistic API response
    }, 300),
    [activeVariant.stock, activeVariant.isBackorderable, activeVariant.lowStockThreshold]
  );

  // Handle PIN code input change
  const handlePinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Allow only digits, max 6
    setPinCode(value);

    if (value.length === 6) {
      const savedLocation = JSON.parse(localStorage.getItem('g36-location') || '{}');
      localStorage.setItem('g36-location', JSON.stringify({ ...savedLocation, pincode: value }));
      calculateDeliveryEstimate(value, savedLocation.location, savedLocation.district);
    } else {
      setDeliveryEstimate(null);
      setPinCodeError(null);
      setIsCheckingPin(false);
    }
  };

  // Calculate discount
  const discount = useMemo(
    () =>
      activeVariant.mrp && activeVariant.mrp > activeVariant.ourPrice
        ? Math.round(((activeVariant.mrp - activeVariant.ourPrice) / activeVariant.mrp) * 100)
        : 0,
    [activeVariant.mrp, activeVariant.ourPrice]
  );

  // Handle share functionality
  const handleShare = useCallback(() => {
    if (typeof window === 'undefined' || !product) {
      toast.error('Sharing is not available');
      return;
    }

    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ₹${activeVariant.ourPrice.toLocaleString()}${
        discount > 0 ? ` (${discount}% OFF)` : ''
      }`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => toast.success('Shared successfully!'))
        .catch(() => {
          navigator.clipboard
            .writeText(shareData.url)
            .then(() => toast.success('Link copied to clipboard!'))
            .catch(() => toast.error('Failed to share product'));
        });
    } else {
      navigator.clipboard
        .writeText(shareData.url)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  }, [product, activeVariant.ourPrice, discount]);

  // Compute attribute keys and options
  const attributeKeys = useMemo(() => {
    if (!product?.productParent?.variants) return [];

    const allowedAttributes = ['processor', 'graphics', 'ram', 'storage'];
    const keys = new Set<string>();
    const valueCounts = new Map<string, Set<string>>();

    product.productParent.variants.forEach((variant) => {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (allowedAttributes.includes(key.toLowerCase())) {
          keys.add(key);
          if (!valueCounts.has(key)) {
            valueCounts.set(key, new Set<string>());
          }
          valueCounts.get(key)!.add(String(value));
        }
      });
    });

    return Array.from(keys).filter((key) => valueCounts.get(key)!.size > 1);
  }, [product?.productParent?.variants]);

  const attributeOptions = useMemo(() => {
    if (!product?.productParent?.variants) return {};

    return attributeKeys.reduce((acc, key) => {
      const options = Array.from(
        new Set(
          product.productParent?.variants
            ?.map((variant) => String(variant.attributes[key]))
            .filter((value): value is string => !!value) ?? []
        )
      ).map((value) => ({
        value,
        label: value,
        variantIds: product.productParent?.variants
          ?.filter((v) => String(v.attributes[key]) === value)
          .map((v) => v.id) ?? [],
      }));
      acc[key] = options;
      return acc;
    }, {} as Record<string, Array<{ value: string; label: string; variantIds: string[] }>>);
  }, [attributeKeys, product?.productParent?.variants]);

  const findValidVariant = useCallback(
    (key: string, value: string | number | boolean) => {
      return product?.productParent?.variants?.find((variant) =>
        String(variant.attributes[key]) === String(value)
      );
    },
    [product?.productParent?.variants]
  );

  const isValidAttributeCombination = useCallback(
    (key: string, value: string | number | boolean) => {
      return product?.productParent?.variants?.some((variant) =>
        String(variant.attributes[key]) === String(value)
      ) ?? false;
    },
    [product?.productParent?.variants]
  );

  const handleAttributeSelection = useCallback(
    (key: string, value: string | number | boolean) => {
      const validVariant = findValidVariant(key, value);
      if (!validVariant) return;

      const newAttributes = { [key]: value };
      attributeKeys.forEach((k) => {
        if (k !== key) {
          newAttributes[k] = validVariant.attributes[k] ?? selectedAttributes[k] ?? '';
        }
      });

      setSelectedAttributes(newAttributes);
    },
    [attributeKeys, findValidVariant, setSelectedAttributes, selectedAttributes]
  );

  const handleVariantNavigation = useCallback(() => {
    if (!activeVariant || activeVariant.id === product?.id || isNavigating) return;

    setIsNavigating(true);
    const fetchNewProduct = async () => {
      try {
        const res = await fetch(`/api/products/${activeVariant.slug}`);
        if (!res.ok) {
          toast.error('Failed to load variant data');
          setIsNavigating(false);
          return;
        }
        const newProduct: FlattenedProduct = await res.json();
        setProduct(newProduct);
        router.push(`/product/${activeVariant.slug}`, { scroll: false });
      } catch (error) {
        toast.error('Network error while loading variant');
      } finally {
        setIsNavigating(false);
      }
    };

    fetchNewProduct();
  }, [activeVariant, product?.id, router, isNavigating, setProduct]);

  // Non-varying attributes
  const nonVaryingAttributes = useMemo(() => {
    if (!product?.productParent?.variants) return [];

    const allKeys = new Set<string>();
    product.productParent.variants.forEach((variant) => {
      Object.keys(variant.attributes).forEach((key) => allKeys.add(key));
    });

    return Array.from(allKeys)
      .filter((key) => !attributeKeys.includes(key))
      .map((key) => {
        const values = new Set(
          product.productParent?.variants.map((v) => String(v.attributes[key])).filter((v): v is string => !!v)
        );
        if (values.size === 1) {
          return { key, value: values.values().next().value };
        }
        return null;
      })
      .filter((item): item is { key: string; value: string } => item !== null);
  }, [attributeKeys, product?.productParent?.variants]);

  // Check wishlist status
  const isInWishlistStatus = product && activeVariant ? isInWishlist(product.productId, activeVariant.id) : false;

  // Handle wishlist click
  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error('Please login to manage wishlist.');
      router.push('/signin');
      return;
    }

    if (!product) return;

    setIsAddingToWishlist(true);
    try {
      const result = isInWishlistStatus
        ? await removeFromWishlist(userId, product.productId, activeVariant.id)
        : await addToWishlist(userId, product.productId, activeVariant.id);

      refetchWishlist();

      if (result.success) {
        toast.success(isInWishlistStatus ? 'Removed from wishlist!' : 'Added to wishlist!');
        fetchWishlist();
        refetchProfile?.('profile', userId, true);
      } else {
        toast.error(result.message || `Failed to ${isInWishlistStatus ? 'remove from' : 'add to'} wishlist`);
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  // Handle cart click
  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error('Please login to add to cart.');
      router.push('/signin');
      return;
    }

    if (!activeVariant || !product) {
      toast.error('Selected variant is not available');
      return;
    }

    if (activeVariant.stock < quantity && !activeVariant.isBackorderable) {
      toast.error(`Only ${activeVariant.stock} items available in stock`);
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(activeVariant.productId, activeVariant.id, quantity);
      refetchCart();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle buy now click
  const handleBuyNowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error('Please login to proceed with purchase.');
      router.push('/signin');
      return;
    }

    if (!activeVariant || !product) {
      toast.error('Selected variant is not available');
      return;
    }

    if (activeVariant.stock < quantity && !activeVariant.isBackorderable) {
      toast.error(`Only ${activeVariant.stock} items available in stock`);
      return;
    }

    setIsAddingToCart(true);
    try {
      const success = await handleBuyNow(userId);
      if (success) {
        await router.push('/checkout');
      } else {
        toast.error('Failed to proceed to checkout');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle attribute selection effect
  useEffect(() => {
    if (!product?.productParent?.variants) return;

    const currentVariant = product.productParent.variants.find((v) => v.id === product.id);
    if (!currentVariant) return;

    const isValidSelection =
      Object.keys(selectedAttributes).length > 0 &&
      product.productParent.variants.some((v) =>
        Object.entries(selectedAttributes).every(([key, value]) => String(v.attributes[key]) === String(value))
      );

    if (!isValidSelection) {
      const newAttributes = attributeKeys.reduce((acc, key) => {
        acc[key] = String(currentVariant.attributes[key] || '');
        return acc;
      }, {} as Record<string, string | number | boolean>);
      setSelectedAttributes(newAttributes);
    }
  }, [product?.productParent?.variants, attributeKeys, setSelectedAttributes, selectedAttributes, product?.id]);

  // Handle variant navigation effect
  useEffect(() => {
    handleVariantNavigation();
  }, [handleVariantNavigation]);

  const increaseQuantity = () => {
    if (quantity < 10 && (activeVariant.stock >= quantity + 1 || activeVariant.isBackorderable)) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const formatAttributeLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  };

  // Render loading state
  if (!product || !product.productParent || product.productParent.variants.length === 0) {
    return (
      <div className={cn('p-6 bg-white rounded-xl shadow-lg', className)}>
        <Toaster />
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading product...</h1>
        <p className="text-gray-500">Product details are not available.</p>
      </div>
    );
  }

  const Pricing = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-3xl font-medium text-gray-900">
          ₹{activeVariant.ourPrice.toLocaleString()}
        </span>
        {activeVariant.mrp && activeVariant.mrp > activeVariant.ourPrice && (
          <div className="flex items-center gap-1 text-base text-gray-500">
            <span>MRP</span>
            <div className="relative inline-block">
              <span>₹{activeVariant.mrp.toLocaleString()}</span>
              <span className="absolute left-0 top-1/2 w-full h-[1px] bg-gray-500 transform rotate-[5deg]" />
            </div>
          </div>
        )}
        {discount > 0 && (
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
            {discount}% OFF
          </span>
        )}
      </div>
      <span className="text-sm text-gray-500">Inclusive of all taxes</span>
      {activeVariant.stock > (activeVariant.lowStockThreshold ?? 0) ? (
        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
          <Package className="w-4 h-4" /> In stock, {activeVariant.stock} units left
        </span>
      ) : activeVariant.isBackorderable ? (
        <span className="text-yellow-600 text-sm font-medium flex items-center gap-1">
          <Package className="w-4 h-4" /> Available for backorder
        </span>
      ) : (
        <span className="text-red-600 text-sm font-medium flex items-center gap-1">
          <Package className="w-4 h-4" /> Out of Stock
        </span>
      )}
    </div>
  );

  const DeliveryEstimation = () => {
    const savedLocation = JSON.parse(localStorage.getItem('g36-location') || '{}');
    const { location, district } = savedLocation;

    return (
      <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" /> Delivery Details
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex items-center w-full max-w-xs">
              <MapPin className="absolute left-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={pinCode}
                onChange={handlePinCodeChange}
                placeholder="Enter 6-digit PIN code"
                maxLength={6}
                className="pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-white"
                aria-label="Enter PIN code for delivery estimation"
              />
            </div>
          </div>
          {isCheckingPin && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Checking delivery details...
            </div>
          )}
          {pinCodeError && (
            <span className="text-red-500 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {pinCodeError}
            </span>
          )}
          {deliveryEstimate && !isCheckingPin && (
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> {deliveryEstimate}
            </p>
          )}
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Free delivery on orders above ₹499
          </p>
        </div>
      </div>
    );
  };

  const QuantityAndWishlist = () => (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center border border-gray-300 rounded-full px-3 py-1.5 bg-white">
        <span className="mr-3 text-gray-700 text-sm">Qty:</span>
        <button
          onClick={decreaseQuantity}
          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="px-4 text-sm font-medium">{quantity}</span>
        <button
          onClick={increaseQuantity}
          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
          aria-label="Increase quantity"
          disabled={(quantity >= 10) || (activeVariant.stock < quantity + 1 && !activeVariant.isBackorderable)}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={handleWishlistClick}
        className={cn(
          'p-2 rounded-full transition-colors border cursor-pointer',
          isInWishlistStatus ? 'text-red-500 border-red-500 bg-red-50' : 'text-gray-500 border-gray-300 bg-white',
          'hover:bg-gray-100 disabled:opacity-50'
        )}
        disabled={isAddingToWishlist}
        aria-label={isInWishlistStatus ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          size={20}
          fill={isInWishlistStatus ? 'red' : 'none'}
          className={isInWishlistStatus ? 'text-red-500' : 'text-gray-500'}
        />
      </button>
    </div>
  );

  const Actions = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:static md:border-t-0 md:p-0 z-10">
      <div className="flex gap-4 max-w-3xl mx-auto">
        <button
          onClick={handleCartClick}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full border border-gray-300 hover:bg-gray-50 text-sm font-semibold transition-colors',
            isAddingToCart || (activeVariant.stock <= 0 && !activeVariant.isBackorderable)
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          )}
          disabled={isAddingToCart || (activeVariant.stock <= 0 && !activeVariant.isBackorderable)}
        >
          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 5H17.5L16 12H6.5L5 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path
              d="M5 5L4.5 3H2.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 12L6 14H16.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="7.5" cy="17" r="1" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="15.5" cy="17" r="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button
          onClick={handleBuyNowClick}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors',
            isAddingToCart || (!activeVariant.stock && !activeVariant.isBackorderable)
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          )}
          disabled={isAddingToCart || (!activeVariant.stock && !activeVariant.isBackorderable)}
        >
          Buy Now
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.75 10H16.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M11.25 5L16.25 10L11.25 15"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  const WarrantyAndDetails = () => (
    <div className="mt-6 bg-white rounded-lg p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-gray-600" /> Warranty & Additional Details
      </h2>
      <ul className="space-y-4 text-sm text-gray-600">
        <li className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <span className="font-medium">Warranty:</span>{' '}
            1 Year Manufacturer Warranty for Device and 6 Months for In-Box Accessories
          </div>
        </li>
        <li className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <span className="font-medium">Customer Support:</span> Contact us at support@techtrend.in or call 1800-123-4567
          </div>
        </li>
      </ul>
    </div>
  );

  return (
    <div className={cn('p-4 md:p-6 max-w-3xl mx-auto', className)}>
      <Toaster />
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>

      <h1 className="text-xl md:text-2xl font-medium text-gray-900 mb-4">{product.name}</h1>

      <Pricing />
      <DeliveryEstimation />

      <div className="my-6 space-y-4">
        {attributeKeys.map((key) => {
          const options = attributeOptions[key] || [];
          if (options.length === 0) return null;

          return (
            <div key={key} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">{formatAttributeLabel(key)}</h3>
              <div className="flex gap-2 flex-wrap">
                {options.map((option) => {
                  const isSelected = String(selectedAttributes[key]) === option.value;
                  const isValid = isValidAttributeCombination(key, option.value);

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAttributeSelection(key, option.value)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm border transition-colors',
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-900 border-gray-300 hover:bg-primary-hover',
                        !isValid && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={!isValid}
                      aria-label={option.label}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="my-6">
        <QuantityAndWishlist />
      </div>

      <Actions />

      <div className="mt-6">
        {nonVaryingAttributes.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" /> Product Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nonVaryingAttributes.map((item) => (
                <p key={item.key} className="text-sm text-gray-600 flex items-start gap-3">
                  <span className="font-medium">{formatAttributeLabel(item.key)}:</span> {item.value}
                </p>
              ))}
            </div>
          </div>
        )}
        <WarrantyAndDetails />
      </div>
    </div>
  );
}