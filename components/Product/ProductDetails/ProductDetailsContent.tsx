"use client";
import {
  Heart,
  Minus,
  Plus,
  Share2,
  Truck,
  Shield,
  Package,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useCallback, useRef, JSX } from "react";
import { addToWishlist, removeFromWishlist } from "@/utils/wishlist.utils";
import { useWishlistStore } from "@/store/wishlist-store";
import { useProductStore } from "@/store/product-store";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { ProductVariant, FlattenedProduct } from "@/types/product";
import { refetchCart, refetchWishlist } from "@/app/provider";
import { showFancyToast } from "@/components/Reusable/ShowCustomToast";
import { X, CreditCard } from "lucide-react";

interface ProductDetailsContentProps {
  className?: string;
  activeVariant: ProductVariant;
}

export default function ProductDetailsContent({
  className,
  activeVariant,
}: ProductDetailsContentProps) {
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
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isInWishlist, fetchWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);
  const [pinCodeError, setPinCodeError] = useState<string | null>(null);
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [district, setDistrict] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Add ref for input focus
  const userId = user?.id;

  const [isEmiOpen, setIsEmiOpen] = useState(false);
  const [emiName, setEmiName] = useState("");
  const [emiPhone, setEmiPhone] = useState("");
  const [emiEmail, setEmiEmail] = useState("");
  const [emiPan, setEmiPan] = useState("");
  const [emiBank, setEmiBank] = useState<"HDFC" | "ICICI" | "BAJAJ" | null>(
    "HDFC",
  );
  const [isSubmittingEmi, setIsSubmittingEmi] = useState(false);

  // Debounce function to limit rapid API calls
  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const renderRating = useCallback((): JSX.Element | null => {
    if (
      typeof product?.averageRating !== "number" ||
      isNaN(product?.averageRating) ||
      product?.averageRating <= 3 ||
      product?.averageRating > 5
    )
      return null;

    const stars = Array(5)
      .fill(0)
      .map((_, index) => (
        <span
          key={index}
          className={cn(
            "text-base sm:text-lg",
            index < Math.floor(Number(product?.averageRating))
              ? "text-yellow-500"
              : "text-gray-300",
          )}
        >
          ★
        </span>
      ));

    return (
      <div className="flex items-center">
        <span className="mr-1 font-medium text-[10px] sm:text-sm">
          {Number(product?.averageRating).toFixed(1)}
        </span>
        <div className="flex">{stars}</div>
      </div>
    );
  }, [Number(product?.averageRating)]);

  const handleCheckDelivery = async () => {
    if (!pinCode || pinCode.length !== 6) {
      setPinCodeError("Please enter a valid 6-digit PIN code.");
      setDeliveryEstimate(null);
      setDistrict(null);
      return;
    }

    setIsCheckingPin(true);
    setPinCodeError(null);

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pinCode}`,
      );
      const data = await response.json();

      if (
        data &&
        data[0] &&
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const postOffices = data[0].PostOffice;
        const postOfficeData = postOffices[postOffices.length - 2];
        const districtName = postOfficeData.District;
        const location = postOfficeData.Name;
        setDistrict(`${location}, ${districtName}`);

        // Delivery days logic
        const firstDigit = Number(pinCode[0]);
        let deliveryDays = 5;

        if ([1, 2].includes(firstDigit)) {
          deliveryDays = 5; // North India
        } else if ([7, 8].includes(firstDigit)) {
          deliveryDays = 7; // Northeast/remote
        } else if ([3, 4].includes(firstDigit)) {
          deliveryDays = 5; // Central/West
        } else if ([5, 6].includes(firstDigit)) {
          deliveryDays = 3; // South India
        }

        setDeliveryEstimate(`Estimated delivery in ${deliveryDays} days`);
      } else {
        setPinCodeError("Invalid PIN code or no delivery service available.");
        setDeliveryEstimate(null);
        setDistrict(null);
      }
    } catch (err) {
      setPinCodeError("Failed to check delivery. Try again.");
      setDeliveryEstimate(null);
      setDistrict(null);
    } finally {
      setIsCheckingPin(false);
    }
  };

  // Calculate discount
  const discount = useMemo(
    () =>
      activeVariant.mrp && activeVariant.mrp > activeVariant.ourPrice
        ? Math.round(
            ((activeVariant.mrp - activeVariant.ourPrice) / activeVariant.mrp) *
              100,
          )
        : 0,
    [activeVariant.mrp, activeVariant.ourPrice],
  );

  // Handle share functionality
  const handleShare = useCallback(() => {
    if (typeof window === "undefined" || !product) {
      showFancyToast({
        title: "Sharing Unavailable",
        message: "Sharing is not available at the moment.",
        type: "error",
      });
      return;
    }

    const shareData = {
      title: product.name,
      text: `Check out ${
        product.name
      } - ₹${activeVariant.ourPrice.toLocaleString()}${
        discount > 0 ? ` (${discount}% OFF)` : ""
      }`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() =>
          showFancyToast({
            title: "Success",
            message: "Shared successfully!",
            type: "success",
          }),
        )
        .catch(() => {
          navigator.clipboard
            .writeText(shareData.url)
            .then(() =>
              showFancyToast({
                title: "Success",
                message: "Link copied to clipboard!",
                type: "success",
              }),
            )
            .catch(() =>
              showFancyToast({
                title: "Error",
                message: "Failed to share product",
                type: "error",
              }),
            );
        });
    } else {
      navigator.clipboard
        .writeText(shareData.url)
        .then(() =>
          showFancyToast({
            title: "Success",
            message: "Link copied to clipboard!",
            type: "success",
          }),
        )
        .catch(() =>
          showFancyToast({
            title: "Error",
            message: "Failed to copy link",
            type: "error",
          }),
        );
    }
  }, [product, activeVariant.ourPrice, discount]);

  const normalizeValue = (val: string): string => {
    if (!val) return "";

    let v = val.trim().replace(/\s+/g, " ").toLowerCase();
    let brand = "";

    // --- Detect explicit brand ---
    if (/\bamd\b/i.test(v)) brand = "AMD";
    else if (/\bintel\b/i.test(v)) brand = "Intel";
    else if (/\bnvidia\b/i.test(v)) brand = "NVIDIA";
    else if (/\bmsi\b/i.test(v)) brand = "MSI";
    else if (/\basus\b/i.test(v)) brand = "Asus";

    // --- Remove duplicate brand mentions ---
    if (brand) {
      const brandRegex = new RegExp(`\\b(${brand})\\b`, "ig");
      v = v.replace(brandRegex, "").trim();
    }

    // --- Series inference ---
    if (/ryzen\s*[3579]/i.test(v)) {
      if (!brand) brand = "AMD";
      v = v.replace(/ryzen\s*([3579]).*/i, "Ryzen $1");
    }
    if (/core\s*i\s*[3579]/i.test(v)) {
      if (!brand) brand = "Intel";
      v = v.replace(/core\s*i\s*([3579]).*/i, "Core i$1");
    }
    if (/rtx\s*\d+/i.test(v)) {
      if (!brand) brand = "NVIDIA";
      v = v.replace(/geforce\s*/i, "");
      v = v.replace(/\brtx\s*(\d+).*/i, "RTX $1");
    }

    // --- Special inference for laptop lines ---
    if (/tuf\s+gaming/i.test(v)) {
      if (!brand) brand = "Asus";
      v = v.replace(/tuf\s+gaming/i, "TUF Gaming");
    }
    if (/rog\s+/i.test(v)) {
      if (!brand) brand = "Asus";
      v = v.replace(/rog\s+/i, "ROG ");
    }

    // --- Storage normalization ---
    v = v.replace(/(\d+)\s*(gb|ssd|hdd)/i, "$1 GB");
    v = v.replace(/(\d+)(gb|ssd|hdd)/i, "$1 GB");

    // --- Display sizes ---
    v = v.replace(/(\d+(\.\d+)?)\s*cm\s*\((\d+(\.\d+)?)\s*inch\)/i, "$3 inch");

    // --- Collapse duplicate words ---
    v = v.replace(/\b(\w+)( \1\b)+/gi, "$1");

    // --- Title case ---
    v = v.replace(/\b\w/g, (c) => c.toUpperCase());

    // --- Prepend brand (avoid duplicates) ---
    if (brand && !v.startsWith(brand)) {
      v = `${brand} ${v}`;
    }

    return v.trim();
  };

  // Compute attribute keys and options
  const attributeKeys = useMemo(() => {
    if (!product?.productParent?.variants) return [];

    const allowedAttributes = ["processor", "graphics", "ram", "storage"];
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

    return attributeKeys.reduce(
      (acc, key) => {
        const options = Array.from(
          new Set(
            product.productParent?.variants
              ?.map((variant) =>
                normalizeValue(String(variant.attributes[key] ?? "")),
              )
              .filter((value): value is string => !!value) ?? [],
          ),
        ).map((value) => ({
          value,
          label: value, // already normalized
          variantIds:
            product.productParent?.variants
              ?.filter(
                (v) =>
                  normalizeValue(String(v.attributes[key] ?? "")) === value,
              )
              .map((v) => v.id) ?? [],
        }));
        acc[key] = options;
        return acc;
      },
      {} as Record<
        string,
        Array<{ value: string; label: string; variantIds: string[] }>
      >,
    );
  }, [attributeKeys, product?.productParent?.variants]);

  const findValidVariant = useCallback(
    (key: string, value: string | number | boolean) => {
      const normalizedValue = normalizeValue(String(value));
      return product?.productParent?.variants?.find(
        (variant) =>
          normalizeValue(String(variant.attributes[key] ?? "")) ===
          normalizedValue,
      );
    },
    [product?.productParent?.variants],
  );

  const isValidAttributeCombination = useCallback(
    (key: string, value: string | number | boolean) => {
      const normalizedValue = normalizeValue(String(value));
      return (
        product?.productParent?.variants?.some(
          (variant) =>
            normalizeValue(String(variant.attributes[key] ?? "")) ===
            normalizedValue,
        ) ?? false
      );
    },
    [product?.productParent?.variants],
  );

  const handleAttributeSelection = useCallback(
    (key: string, value: string | number | boolean) => {
      const validVariant = findValidVariant(key, value);
      if (!validVariant) return;

      // Store normalized values for display
      const newAttributes: Record<string, string> = {
        [key]: normalizeValue(String(value)),
      };

      attributeKeys.forEach((k) => {
        if (k !== key) {
          newAttributes[k] = normalizeValue(
            String(validVariant.attributes[k] ?? selectedAttributes[k] ?? ""),
          );
        }
      });

      setSelectedAttributes(newAttributes);

      // Immediately switch to the selected variant
      if (validVariant.id !== activeVariant.id) {
        router.push(`/product/${validVariant.slug}`, { scroll: false });
        // Fetch the full FlattenedProduct for the selected variant before updating the store
        fetch(`/api/products/${validVariant.slug}`)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch variant");
            return res.json();
          })
          .then((newProduct: FlattenedProduct) => {
            setProduct(newProduct);
          })
          .catch(() => {
            // Optionally handle error (e.g., toast)
          });
      }
    },
    [
      attributeKeys,
      findValidVariant,
      setSelectedAttributes,
      selectedAttributes,
      activeVariant.id,
      router,
      setProduct,
    ],
  );

  const handleVariantNavigation = useCallback(() => {
    if (!activeVariant || activeVariant.id === product?.id || isNavigating)
      return;

    setIsNavigating(true);

    router.push(`/product/${activeVariant.slug}`, { scroll: true });
    fetch(`/api/products/${activeVariant.slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch variant");
        return res.json();
      })
      .then((newProduct: FlattenedProduct) => {
        setProduct(newProduct);
        setIsNavigating(false);
      })
      .catch(() => {
        // Optionally handle error (e.g., toast)
        setIsNavigating(false);
      });
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
          product.productParent?.variants
            .map((v) => String(v.attributes[key]))
            .filter((v): v is string => !!v),
        );
        if (values.size === 1) {
          return { key, value: values.values().next().value };
        }
        return null;
      })
      .filter((item): item is { key: string; value: string } => item !== null);
  }, [attributeKeys, product?.productParent?.variants]);

  // Check wishlist status
  const isInWishlistStatus =
    product && activeVariant
      ? isInWishlist(product.productId, activeVariant.id)
      : false;

  // Handle wishlist click
  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      showFancyToast({
        title: "Authentication Required",
        message: "Please login to manage your wishlist.",
        type: "error",
      });
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
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
        showFancyToast({
          title: isInWishlistStatus
            ? "Removed from Wishlist"
            : "Added to Wishlist",
          message: isInWishlistStatus
            ? "Successfully removed from your wishlist."
            : "Successfully added to your wishlist.",
          type: "success",
        });
        fetchWishlist();
      } else {
        showFancyToast({
          title: "Sorry, there was an error",
          message:
            result.message ||
            `Failed to ${
              isInWishlistStatus ? "remove from" : "add to"
            } wishlist`,
          type: "error",
        });
      }
    } catch (error) {
      showFancyToast({
        title: "Sorry, there was an error",
        message: "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  // Handle cart click
  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      showFancyToast({
        title: "Authentication Required",
        message: "Please login to add items to your cart.",
        type: "error",
      });
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!activeVariant || !product) {
      showFancyToast({
        title: "Variant Unavailable",
        message: "Selected variant is not available",
        type: "error",
      });
      return;
    }

    if (activeVariant.stock < quantity && !activeVariant.isBackorderable) {
      showFancyToast({
        title: "Insufficient Stock",
        message: `Only ${activeVariant.stock} items available in stock`,
        type: "error",
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(activeVariant.productId, activeVariant.id, quantity);
      refetchCart();
      showFancyToast({
        title: "Added to Cart",
        message: `${product.name} added to cart successfully.`,
        type: "success",
      });
    } catch (error) {
      showFancyToast({
        title: "Error",
        message: "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle buy now click
  const handleBuyNowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      showFancyToast({
        title: "Login Required",
        message: "Please login to continue",
        type: "error",
      });
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!activeVariant || !product) {
      showFancyToast({
        title: "Variant unavailable",
        message: "Please select a valid variant",
        type: "error",
      });
      return;
    }

    if (activeVariant.stock < quantity && !activeVariant.isBackorderable) {
      showFancyToast({
        title: "Out of stock",
        message: `Only ${activeVariant.stock} items available`,
        type: "error",
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      // 1️⃣ Add to cart
      await addToCart(activeVariant.productId, activeVariant.id, quantity);

      router.push("/cart");

      // 2️⃣ Refresh cart state
      refetchCart();

      showFancyToast({
        title: "Added to Cart",
        message: `${product.name} added to cart.`,
        type: "success",
      });

      // 3️⃣ Go to cart page
    } catch (error) {
      showFancyToast({
        title: "Error",
        message: "Unable to add item to cart. Please try again.",
        type: "error",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleEmiSubmit = async () => {
    if (!emiName.trim() || emiPhone.length !== 10) {
      showFancyToast({
        title: "Invalid details",
        message: "Name and valid phone number are required",
        type: "error",
      });
      return;
    }

    try {
      setIsSubmittingEmi(true);

      const res = await fetch("/api/emi-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeVariant.productId,
          variantId: activeVariant.id,
          price: activeVariant.ourPrice, // ✅ ADD THIS
          bankPreference: emiBank, // ✅ RENAME THIS
          name: emiName.trim(),
          phone: emiPhone,
          email: emiEmail || undefined,
          pan: emiPan || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to submit EMI request");
      }

      setEmiName("");
      setEmiPhone("");
      setEmiEmail("");
      setEmiPan("");
      setEmiBank(null);

      showFancyToast({
        title: "Request submitted 🎉",
        message: "Our EMI team will contact you shortly",
        type: "success",
      });

      setIsEmiOpen(false);
    } catch (err: any) {
      showFancyToast({
        title: "Submission failed",
        message: err.message,
        type: "error",
      });
    } finally {
      setIsSubmittingEmi(false);
    }
  };

  // Handle attribute selection effect
  useEffect(() => {
    if (!product?.productParent?.variants) return;

    const currentVariant = product.productParent.variants.find(
      (v) => v.id === product.id,
    );
    if (!currentVariant) return;

    const isValidSelection =
      Object.keys(selectedAttributes).length > 0 &&
      product.productParent.variants.some((v) =>
        Object.entries(selectedAttributes).every(
          ([key, value]) => String(v.attributes[key]) === String(value),
        ),
      );

    if (!isValidSelection) {
      const newAttributes = attributeKeys.reduce(
        (acc, key) => {
          acc[key] = normalizeValue(
            String(currentVariant.attributes[key] || ""),
          );
          return acc;
        },
        {} as Record<string, string | number | boolean>,
      );
      setSelectedAttributes(newAttributes);
    }
  }, [
    product?.productParent?.variants,
    attributeKeys,
    setSelectedAttributes,
    selectedAttributes,
    product?.id,
  ]);

  const increaseQuantity = () => {
    if (
      quantity < 10 &&
      (activeVariant.stock >= quantity + 1 || activeVariant.isBackorderable)
    ) {
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
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ")
      .trim();
  };

  // Render loading state
  if (
    !product ||
    !product.productParent ||
    product.productParent.variants.length === 0
  ) {
    return (
      <div className={cn("p-6 bg-white rounded-xl shadow-lg", className)}>
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Loading product...
        </h1>
        <p className="text-gray-500">Product details are not available.</p>
      </div>
    );
  }

  const Pricing = () => (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-3xl font-semibold text-gray-900">
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
          <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {discount}% OFF
          </span>
        )}
      </div>
      <span className="text-sm text-gray-500">Inclusive of all taxes</span>
      {activeVariant.stock > (activeVariant.lowStockThreshold ?? 0) ? (
        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
          <Package className="w-4 h-4" /> In stock, {activeVariant.stock} units
          left
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

  const EmiBanner = ({ onOpen }: { onOpen: () => void }) => (
    <div
      onClick={onOpen}
      className="
      my-4 p-4 sm:p-5 cursor-pointer rounded-xl
      border border-primary/20
      bg-gradient-to-r from-primary/10 to-orange-50
      hover:border-primary/40 transition
    "
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left content */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm sm:text-base font-semibold text-primary/90">
              EMI starting from ₹
              {Math.ceil(activeVariant.ourPrice / 12).toLocaleString()}
              <span className="text-xs sm:text-sm font-medium"> / month</span>
            </p>

            <p className="text-xs sm:text-sm text-primary mt-0.5">
              Zero Down Payment and EMI Available • 3, 6 & 12 months
            </p>

            {/* Bank Logos */}
            <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-4">
              <img
                src="/banks/hdfc.png"
                alt="HDFC"
                className=" w-32  object-contain"
              />
              <img
                src="/banks/bajaj.png"
                alt="Bajaj Finserv"
                className="w-32 object-contain"
              />
              <img
                src="/banks/icici.webp"
                alt="ICICI"
                className=" w-32 object-contain"
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-end sm:justify-start">
          <button
            type="button"
            onClick={onOpen}
            className="
            flex items-center gap-1
            text-sm font-medium text-primary
            hover:text-primary/80
            whitespace-nowrap
          "
          >
            View options
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );


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
          disabled={
            quantity >= 10 ||
            (activeVariant.stock < quantity + 1 &&
              !activeVariant.isBackorderable)
          }
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={handleWishlistClick}
        className={cn(
          "p-2 rounded-full transition-colors border cursor-pointer",
          isInWishlistStatus
            ? "text-red-500 border-red-500 bg-red-50"
            : "text-gray-500 border-gray-300 bg-white",
          "hover:bg-gray-100 disabled:opacity-50",
        )}
        disabled={isAddingToWishlist}
        aria-label={
          isInWishlistStatus ? "Remove from wishlist" : "Add to wishlist"
        }
      >
        <Heart
          size={20}
          fill={isInWishlistStatus ? "red" : "none"}
          className={isInWishlistStatus ? "text-red-500" : "text-gray-500"}
        />
      </button>
    </div>
  );

  const Actions = () => {
    const status = (product?.productParent?.status || " ").trim().toLowerCase();

    // console.log("Action Status: ", status)

    const isOutOfStock =
      (activeVariant?.stock ?? 0) <= (activeVariant?.lowStockThreshold ?? 0) &&
      !activeVariant?.isBackorderable;

    // Coming Soon
    if (status === "coming_soon") {
      return (
        <div className="bg-yellow-50 border-t border-yellow-200 p-4 md:p-4">
          <div className="text-center w-full">
            <p className="text-yellow-800 font-semibold">🚀 Coming Soon</p>
            <p className="text-sm text-yellow-600">
              This product isn’t available yet, but it’ll be here soon!
            </p>
          </div>
        </div>
      );
    }

    // Inactive or Discontinued
    if (status === "inactive" || status === "discontinued") {
      return (
        <div className="bg-gray-50 border-t border-gray-200 p-4 md:p-4">
          <div className="text-center w-full">
            <p className="text-gray-700 font-semibold">❌ Not Available</p>
            <p className="text-sm text-gray-500">
              This product has been discontinued or is currently inactive.
            </p>
          </div>
        </div>
      );
    }

    // Default (Active)
    return (
      <div className="bg-white border-t border-gray-200 py-4 md:py-6">
        <div className="flex gap-4 max-w-3xl mx-auto">
          {/* Add to Cart */}
          <button
            onClick={handleCartClick}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full border border-gray-300 hover:bg-gray-50 text-sm font-semibold transition-colors",
              isAddingToCart || isOutOfStock
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer",
            )}
            disabled={isAddingToCart || isOutOfStock}
          >
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </button>

          {/* Buy Now */}
          <button
            onClick={handleBuyNowClick}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors",
              isAddingToCart || isOutOfStock
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer",
            )}
            disabled={isAddingToCart || isOutOfStock}
          >
            Buy Now
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("p-2 md:p-6 w-full  mx-auto", className)}>
      <div className="flex items-center justify-end mb-4 w-full">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>

      <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
        {product.name}
      </h1>

      <div className=" pb-4">
        {/* Rating */}
        {renderRating()}
      </div>

      <Pricing />

      <EmiBanner onOpen={() => setIsEmiOpen(true)} />

      {isEmiOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsEmiOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white w-full max-w-lg mx-4 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">EMI Options</h3>
              </div>
              <button
                onClick={() => setIsEmiOpen(false)}
                className="p-1 rounded-full cursor-pointer hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Banks */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Available Banks & NBFCs
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src="/banks/hdfc.png"
                    alt="HDFC"
                    width={60}
                    height={28}
                  />

                  <img
                    src="/banks/bajaj.png"
                    alt="Bajaj Finserv"
                    width={60}
                    height={28}
                  />
                  <img
                    src="/banks/icici.webp"
                    alt="ICICI"
                    width={60}
                    height={28}
                  />
                </div>
              </div>

              {/* EMI Info */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Zero down payment and EMI</li>
                  <li>Tenure: 3, 6 & 12 months</li>
                  <li>Subject to bank approval</li>
                  <li>Minimum transaction value may apply</li>
                </ul>
              </div>

              {/* Lead Form */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  Get EMI Assistance
                </h4>

                <input
                  type="text"
                  placeholder="Full Name *"
                  value={emiName}
                  onChange={(e) => setEmiName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />

                <input
                  type="tel"
                  placeholder="Phone Number *"
                  maxLength={10}
                  value={emiPhone}
                  onChange={(e) =>
                    setEmiPhone(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />

                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={emiEmail}
                  onChange={(e) => setEmiEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />

                <input
                  type="text"
                  placeholder="PAN Card (optional)"
                  maxLength={10}
                  value={emiPan}
                  onChange={(e) => setEmiPan(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
                />

                <div className="flex gap-2">
                  {(["HDFC", "ICICI", "BAJAJ"] as const).map((bank) => (
                    <button
                      key={bank}
                      onClick={() => setEmiBank(bank)}
                      className={cn(
                        "px-4 py-2 rounded-lg cursor-pointer text-sm border",
                        emiBank === bank
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-gray-300",
                      )}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <button
                onClick={handleEmiSubmit}
                disabled={isSubmittingEmi}
                className={cn(
                  "w-full py-2.5 rounded-lg cursor-pointer font-semibold text-white",
                  isSubmittingEmi
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-hover",
                )}
              >
                {isSubmittingEmi ? "Submitting..." : "Request EMI Callback"}
              </button>

              <p className="text-[11px] text-gray-500 mt-2 text-center">
                By continuing, you agree to be contacted regarding EMI options.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="my-6 space-y-4">
        {attributeKeys.map((key) => {
          const options = attributeOptions[key] || [];
          if (options.length === 0) return null;

          return (
            <div key={key} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {formatAttributeLabel(key)}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {options.map((option) => {
                  const isSelected =
                    String(selectedAttributes[key]) === option.value;
                  const isValid = isValidAttributeCombination(
                    key,
                    option.value,
                  );

                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleAttributeSelection(key, option.value)
                      }
                      className={cn(
                        "px-4 py-2 rounded-full text-sm border transition-colors",
                        isSelected
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-900 border-gray-300 hover:bg-primary-hover",
                        !isValid && "opacity-50 cursor-not-allowed",
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

      <div className=" my-3 md:my-6 bg-white rounded-lg border border-gray-100 p-2 md:p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600" /> Check Delivery
        </h3>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter PIN code"
            maxLength={6}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
          />
          <button
            onClick={handleCheckDelivery}
            disabled={isCheckingPin}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {isCheckingPin ? "Checking..." : "Check"}
          </button>
        </div>

        {/* Results */}
        {pinCodeError && (
          <p className="text-red-500 text-sm mt-2">{pinCodeError}</p>
        )}
        {district && (
          <p className="text-sm text-gray-700 mt-2">
            Delivery available to{" "}
            <span className="font-medium">{district}</span>
          </p>
        )}
        {deliveryEstimate && (
          <p className="text-sm text-green-600 font-medium mt-1">
            {deliveryEstimate}
          </p>
        )}
      </div>

      <div className="mt-6">
        {nonVaryingAttributes.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" /> Product
              Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nonVaryingAttributes.map((item) => (
                <p
                  key={item.key}
                  className="text-sm text-gray-600 flex items-start gap-3"
                >
                  <span className="font-medium">
                    {formatAttributeLabel(item.key)}:
                  </span>{" "}
                  {item.value}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
