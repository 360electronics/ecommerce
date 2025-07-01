'use client';
import { Heart, Minus, Plus, Share2 } from 'lucide-react';
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
  const userId = user?.id;

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
      refetchCart()
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
    if (activeVariant.stock >= quantity + 1 || activeVariant.isBackorderable) {
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

  // Render loading state if product is not available
  if (!product || !product.productParent || product.productParent.variants.length === 0) {
    return (
      <div className={cn('p-4', className)}>
        <Toaster />
        <div className="flex items-center gap-2 justify-end mb-4 cursor-pointer text-sm" onClick={handleShare}>
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </div>
        <h1 className="text-xl font-semibold mb-4">Loading product...</h1>
        <p className="text-gray-500">Product details are not available.</p>
      </div>
    );
  }

  const Pricing = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-3xl font-bold text-gray-900">
          ₹{activeVariant.ourPrice.toLocaleString()}
        </span>
        {activeVariant.mrp && activeVariant.mrp > activeVariant.ourPrice && (
          <div className="flex items-center gap-1 text-lg text-gray-500">
            <span>MRP</span>
            <div className="relative inline-block">
              <span>₹{activeVariant.mrp.toLocaleString()}</span>
              <span className="absolute left-0 top-1/2 w-full h-[1px] bg-gray-500 transform rotate-[5deg]" />
            </div>
          </div>
        )}
        {discount > 0 && (
          <span className="bg-red-600 text-white text-xs font-medium px-3 py-1 rounded-full">
            {discount}% OFF
          </span>
        )}
      </div>
      {activeVariant.stock > (activeVariant.lowStockThreshold ?? 0) ? (
        <span className="text-green-600 text-sm font-medium">
          {activeVariant.stock} left in stock
        </span>
      ) : activeVariant.isBackorderable ? (
        <span className="text-yellow-600 text-sm font-medium">Available for backorder</span>
      ) : (
        <span className="text-red-600 text-sm font-medium">Out of Stock</span>
      )}
    </div>
  );

  const QuantityAndWishlist = () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-gray-300 rounded-full px-3 py-1">
        <span className="mr-3 text-gray-700 text-sm">Qty</span>
        <button
          onClick={decreaseQuantity}
          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="px-4 text-sm">{quantity}</span>
        <button
          onClick={increaseQuantity}
          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          aria-label="Increase quantity"
          disabled={activeVariant.stock < quantity + 1 && !activeVariant.isBackorderable}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={handleWishlistClick}
        className={cn(
          'p-2 rounded-full transition-colors',
          isInWishlistStatus ? 'text-red-500 bg-red-100' : 'text-gray-500 bg-gray-100',
          'hover:bg-gray-200 disabled:opacity-50'
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
    <div className="grid grid-cols-2 gap-4 w-full md:w-3/4">
      <button
        onClick={handleCartClick}
        className={cn(
          'flex items-center justify-center gap-2 py-3 px-6 rounded-full border border-gray-300 hover:border-gray-400 text-sm font-medium transition-colors',
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
          'flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors',
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
  );

  return (
    <div className={cn('space-y-6 w-full md:h-[90dvh] md:overflow-auto', className)}>
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

      <h1 className="text-base md:text-2xl font-semibold text-gray-900">{product.name}</h1>

      <Pricing />

      <div className="space-y-4 flex flex-wrap gap-4">
        {attributeKeys.map((key) => {
          const options = attributeOptions[key] || [];
          if (options.length === 0) return null;

          return (
            <div key={key} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">{formatAttributeLabel(key)}</h3>
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
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400 hover:bg-blue-50',
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

      <QuantityAndWishlist />
      <Actions />

      {nonVaryingAttributes.length > 0 && (
        <div className="mt-2 py-6 bg-white rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Product Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 px-4">
            {nonVaryingAttributes.map((item) => (
              <p key={item.key} className="text-sm md:text-base text-gray-600 list-item">
                <span className="font-medium">{formatAttributeLabel(item.key)}:</span> {item.value}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}