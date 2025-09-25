"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserLayout from "@/components/Layouts/UserLayout";
import CheckoutLayout from "@/components/Layouts/CheckoutLayout";
import toast from "react-hot-toast";
import { Plus, Check, Truck, CreditCard, Loader2 } from "lucide-react";
import Script from "next/script";
import { useAuthStore } from "@/store/auth-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";

interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: "home" | "work" | "other";
  isDefault: boolean;
}



const CheckoutPage: React.FC = () => {
  const { isLoggedIn, isLoading, user } = useAuthStore();
  const { checkoutItems, fetchCheckoutItems, clearCheckout } = useCheckoutStore();
  const { coupon, couponStatus, applyCoupon, removeCoupon, markCouponUsed, clearCoupon } = useCartStore();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cashfree">("cashfree");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // New address form state
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    gst: "",
    addressType: "home" as "home" | "work" | "other",
    isDefault: false,
  });

  // Fetch addresses
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      const fetchAddresses = async () => {
        try {
          const response = await fetch(`/api/users/addresses?userId=${user.id}`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to fetch addresses");
          const data: Address[] = await response.json();
          setAddresses(data);
          const defaultAddress = data.find((addr) => addr.isDefault);
          setSelectedAddressId(defaultAddress ? defaultAddress.id : data[0]?.id || null);
        } catch (error) {
          console.error("Error fetching addresses:", error);
          toast.error("Failed to fetch addresses");
        }
      };
      fetchAddresses();
    }
  }, [isLoggedIn, user?.id]);

  // Fetch city for selected address postal code
  useEffect(() => {
    const fetchCityFromPincode = async () => {
      if (selectedAddressId) {
        const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
        if (selectedAddress?.postalCode) {
          try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${selectedAddress.postalCode}`);
            if (!response.ok) throw new Error("Failed to fetch pincode data");
            const data = await response.json();
            if (data[0]?.Status === "Success" && data[0]?.PostOffice?.[0]?.District) {
              const city = data[0].PostOffice[0].District.toLowerCase().trim();
              setSelectedCity(city);
            } else {
              setSelectedCity(null);
              toast.error("Invalid postal code or city not found");
            }
          } catch (error) {
            console.error("Error fetching city from pincode:", error);
            setSelectedCity(null);
            toast.error("Failed to verify postal code");
          }
        } else {
          setSelectedCity(null);
        }
      }
    };
    fetchCityFromPincode();
  }, [selectedAddressId, addresses]);

  // Check if express delivery is available
  const isExpressAvailable =
    checkoutItems.length > 0 &&
    checkoutItems.every((item) => item.product.deliveryMode === "express") &&
    selectedCity &&
    ["coimbatore", "chennai", "erode", "madurai"].includes(selectedCity);

  // Reset deliveryMode to standard if express is not available
  useEffect(() => {
    if (!isExpressAvailable && deliveryMode === "express") {
      setDeliveryMode("standard");
    }
  }, [isExpressAvailable, deliveryMode]);

  // Handle new address submission
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newAddress.fullName ||
      !newAddress.phoneNumber ||
      !newAddress.addressLine1 ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.postalCode
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch("/api/users/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user!.id,
          ...newAddress,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save address");
      }
      const savedAddress: Address = await response.json();
      setAddresses([...addresses, savedAddress]);
      setSelectedAddressId(savedAddress.id);
      setShowAddressForm(false);
      setNewAddress({
        fullName: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        gst: "",
        addressType: "home",
        isDefault: false,
      });
      toast.success("Address added successfully");
    } catch (error: any) {
      console.error("Error adding address:", error);
      toast.error(error.message || "Failed to save address");
    }
  };

  // Handle cancel checkout
  const handleCancelCheckout = async () => {
    try {
      await clearCheckout(user!.id);
      toast.success("Checkout cancelled");
      router.push("/");
    } catch (error) {
      console.error("Error cancelling checkout:", error);
      toast.error("Failed to cancel checkout");
    }
  };

  // Handle apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast.error("Please enter a coupon code");
      return;
    }
    await applyCoupon(couponCode);
    const { couponStatus: status, coupon } = useCartStore.getState();
    if (status === "applied" && coupon) {
      toast.success(`Coupon ${coupon.code} applied (${coupon.type === 'amount' ? formatCurrency(coupon.value) : `${coupon.value}%`})`);
    } else if (status === "invalid") {
      toast.error("Invalid coupon code");
    } else if (status === "invalid_amount") {
      toast.error("Coupon has an invalid discount value");
    } else if (status === "expired") {
      toast.error("Coupon has expired");
    } else if (status === "used") {
      toast.error("Coupon has already been used");
    }
    setCouponCode("");
  };

  // Calculate estimated delivery dates
  const getEstimatedDeliveryDate = (mode: "standard" | "express") => {
    const today = new Date();
    const daysToAdd = mode === "standard" ? 7 : 1;
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + daysToAdd);
    return estimatedDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    // Calculate subtotal for regular products
    const regularProductsSubtotal = checkoutItems.reduce((sum, item) => {
      const itemPrice = Number(item.variant.ourPrice) || 0;
      return sum + itemPrice * item.quantity;
    }, 0);

    // Calculate offer products total (only one offer product allowed, quantity is always 1)
    const offerProductsTotal = checkoutItems.reduce((sum, item) => {
      if (!item.cartOfferProductId) return sum;
      const offerPrice = Number(item.offerProduct.ourPrice) || 0;
      return sum + offerPrice; // Quantity is always 1 for offer products
    }, 0);

    // Total subtotal including both regular and offer products
    const subtotal = regularProductsSubtotal + offerProductsTotal;

    // Calculate savings for regular products
    const savings = checkoutItems.reduce((total, item) => {
      if (item.cartOfferProductId) return total; // No savings on offer products
      const mrp = Number(item.variant.mrp) || Number(item.variant.ourPrice) || 0;
      const ourPrice = Number(item.variant.ourPrice) || 0;
      return total + (mrp - ourPrice) * item.quantity;
    }, 0);

    // Calculate coupon discount
    const discountAmount =
      coupon && couponStatus === "applied"
        ? coupon.type === "amount"
          ? coupon.value || 0
          : (subtotal * (coupon.value || 0)) / 100
        : 0;

    // Calculate shipping amount
    const shippingAmount =
      subtotal > 500 && deliveryMode === "standard"
        ? 0
        : checkoutItems.reduce(
          (sum, item) =>
            sum +
            (deliveryMode === "standard" ? 50 : 79) *
            (item.cartOfferProductId ? 1 : item.quantity), // Offer product counts as 1 item
          0
        );

    const grandTotal = Math.max(0, subtotal - discountAmount) + shippingAmount;

    return { subtotal, regularProductsSubtotal, offerProductsTotal, savings, discountAmount, shippingAmount, grandTotal };
  };

  const { subtotal, regularProductsSubtotal, offerProductsTotal, savings, discountAmount, shippingAmount, grandTotal } =
    calculateTotals();

  // Format currency
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    });
  };



  // Handle Cashfree payment
  async function initiateCashfreePayment({ id, totalAmount }: { id: string; totalAmount: number }) {

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (!selectedAddress) {
      throw new Error("No address selected");
    }

    const res = await fetch("/api/cashfree/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: `${id}`,
        orderAmount: totalAmount,
        customerName: selectedAddress.fullName,
        customerEmail: user?.email,
        customerPhone: selectedAddress.phoneNumber,
      }),
    });

    const data = await res.json();
    console.log(data)
    if (!res.ok) return null;

    // Load SDK
    if (!(window as any).Cashfree) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }

    const cashfree = new (window as any).Cashfree({ mode: "sandbox" }); 
    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: '_self',
      theme: {
        color: {
          primary: "#ff6b00", 
          primaryHover: "#cd5703",
          text: "#1F2937",
          background: "#FFFFFF"
        },
        mode: "light", // or "dark"
        branding: {
          primaryColor: "#ff6b00",
          backgroundColor: "#FFFFFF",
          textColor: "#1F2937",
          merchantName: "360 Electronics : No.1 Seller in South India",
          merchantLogo: "https://360electronics.in/logo/logo.png", 
        }
      }
    });

    return data.orderId;
  }


  // Handle order confirmation
  const handleConfirmOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    if (!checkoutItems.length) {
      toast.error("Your checkout is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = {
        userId: user!.id,
        addressId: selectedAddressId,
        totalAmount: grandTotal,
        discountAmount: discountAmount,
        couponCode: coupon && couponStatus === "applied" ? coupon.code : null,
        shippingAmount,
        deliveryMode,
        paymentMethod,
        status: paymentMethod === "cashfree" ? "pending" : "confirmed",
        paymentStatus: "pending",
        orderItems: checkoutItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.cartOfferProductId ? 1 : item.quantity, // Offer product quantity is always 1
          unitPrice: Number(item.variant.ourPrice) || 0,
          cartOfferProductId: item.cartOfferProductId,
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      console.log(response.ok)

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const createdOrder = await response.json();


      if (paymentMethod === "cashfree") {
        const cashfreeOrderId = await initiateCashfreePayment({
          id: createdOrder.id,
          totalAmount: grandTotal,
        });

        await clearCheckout(user!.id);


        if (!cashfreeOrderId) {
          throw new Error("Failed to initiate Cashfree payment");
        }
      } else {
        if (coupon && coupon.code && couponStatus === "applied") {
          await markCouponUsed(coupon.code);
        }
        await fetch("/api/orders/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrder.id,
            status: "confirmed",
            paymentStatus: "pending",
          }),
        });
        clearCoupon();

      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };





  if (isLoading) {
    return (
      <UserLayout>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-lg">Loading checkout...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
      <CheckoutLayout>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {/* Post-Payment Processing Overlay */}
          {isProcessingPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <p className="text-lg font-medium text-gray-900">
                  Please wait, processing your order...
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
                {addresses.length === 0 && !showAddressForm ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">No saved addresses found.</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-HOVER transition-colors"
                    >
                      <Plus size={20} /> Add New Address
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedAddressId === address.id
                              ? "border-primary bg-primary-LIGHT"
                              : "border-gray-200 hover:border-secondary"
                            }`}
                          onClick={() => setSelectedAddressId(address.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{address.fullName}</p>
                              <p className="text-sm text-gray-600">{address.phoneNumber}</p>
                              <p className="text-sm text-gray-600">
                                {address.addressLine1}
                                {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city},{" "}
                                {address.state} {address.postalCode}, {address.country}
                              </p>
                              <p className="text-sm text-gray-600 capitalize">{address.addressType}</p>
                              {address.isDefault && (
                                <p className="text-sm text-primary font-medium">Default</p>
                              )}
                            </div>
                            {selectedAddressId === address.id && (
                              <Check className="text-primary h-5 w-5" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {!showAddressForm && (
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-HOVER"
                      >
                        <Plus size={20} /> Add New Address
                      </button>
                    )}
                  </>
                )}

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="mt-6 space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Add New Address</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={newAddress.fullName}
                          onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          id="phoneNumber"
                          type="tel"
                          value={newAddress.phoneNumber}
                          onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                          Address Line 1
                        </label>
                        <input
                          id="addressLine1"
                          type="text"
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          id="addressLine2"
                          type="text"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          id="city"
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <input
                          id="state"
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                          Postal Code
                        </label>
                        <input
                          id="postalCode"
                          type="text"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <input
                          id="country"
                          type="text"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="gst" className="block text-sm font-medium text-gray-700">
                          GST (Optional)
                        </label>
                        <input
                          id="gst"
                          type="text"
                          value={newAddress.gst}
                          onChange={(e) => setNewAddress({ ...newAddress, gst: e.target.value })}
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                        />
                      </div>
                      <div>
                        <label htmlFor="addressType" className="block text-sm font-medium text-gray-700">
                          Address Type
                        </label>
                        <select
                          id="addressType"
                          value={newAddress.addressType}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, addressType: e.target.value as "home" | "work" | "other" })
                          }
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                        >
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="isDefault"
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          className="h-4 w-4 text-primary focus:ring-primary-LIGHT0 border-gray-300 rounded"
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                          Set as default
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-HOVER transition-colors"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Delivery Mode */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Mode</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${deliveryMode === "standard"
                        ? "border-primary bg-primary-LIGHT"
                        : "border-gray-200 hover:border-secondary"
                      }`}
                    onClick={() => setDeliveryMode("standard")}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="h-6 w-6 text-gray-600" />
                      <div>
                        <p className="text-gray-900 font-medium">
                          Standard Delivery ({subtotal > 500 ? "Free" : "₹50/item"})
                        </p>
                        <p className="text-sm text-gray-600">
                          Estimated delivery by {getEstimatedDeliveryDate("standard")}
                        </p>
                        <p className="text-sm text-gray-500">Reliable and cost-effective shipping</p>
                      </div>
                    </div>
                    {deliveryMode === "standard" && (
                      <Check className="absolute right-4 top-4 text-primary h-5 w-5" />
                    )}
                  </div>
                  {isExpressAvailable && (
                    <div
                      className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${deliveryMode === "express"
                          ? "border-primary bg-primary-LIGHT"
                          : "border-gray-200 hover:border-secondary"
                        }`}
                      onClick={() => setDeliveryMode("express")}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="text-gray-900 font-medium">Express Delivery (₹79/item)</p>
                          <p className="text-sm text-gray-600">
                            Estimated delivery by {getEstimatedDeliveryDate("express")}
                          </p>
                          <p className="text-sm text-gray-500">Fast and priority shipping</p>
                        </div>
                      </div>
                      {deliveryMode === "express" && (
                        <Check className="absolute right-4 top-4 text-primary h-5 w-5" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${paymentMethod === "cashfree"
                        ? "border-primary bg-primary-LIGHT"
                        : "border-gray-200 hover:border-secondary"
                      }`}
                    onClick={() => setPaymentMethod("cashfree")}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-gray-600" />
                      <div>
                        <p className="text-gray-900 font-medium">Pay with Cashfree</p>
                        <p className="text-sm text-gray-500">Secure online payment with UPI/Card</p>
                      </div>
                    </div>
                    {paymentMethod === "cashfree" && (
                      <Check className="absolute right-4 top-4 text-primary h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 nohemi-bold">Order Summary</h2>
                <div className="space-y-4">
                  <div className="space-y-4">
                    {checkoutItems.map((item) => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex gap-4">
                          <img
                            src={item.variant.productImages[0]?.url || "/placeholder.png"}
                            alt={item.product.shortName}
                            className="w-16 h-16 object-contain rounded-md"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.product.shortName}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(Number(item.variant.ourPrice) * item.quantity)}
                            </p>
                          </div>
                        </div>
                        {item.cartOfferProductId && item.offerProduct && (
                          <div className="flex gap-4 pl-4 border-l-2 border-green-200">
                            <img
                              src={item.offerProduct.productImage || "/placeholder.png"}
                              alt={item.offerProduct.productName}
                              className="w-12 h-12 object-contain rounded-md"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.offerProduct.productName}</p>
                              <p className="text-sm text-gray-600">Qty: 1</p>
                              <p className="text-sm font-medium text-green-600">
                                +{formatCurrency(Number(item.offerProductPrice))}
                              </p>
                              <p className="text-xs text-gray-500">Offer product</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {/* Coupon Section */}
                    <div>
                      <label htmlFor="coupon-checkout" className="block text-sm font-medium text-gray-700 mb-1">
                        Coupon Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="coupon-checkout"
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-LIGHT0"
                          disabled={couponStatus === "applied"}
                        />
                        {coupon && couponStatus === "applied" ? (
                          <button
                            onClick={removeCoupon}
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={handleApplyCoupon}
                            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-HOVER transition-colors text-sm font-medium"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {couponStatus === "applied" && coupon && (
                        <p className="text-sm text-green-600 mt-2">
                          Coupon {coupon.code} applied (
                          {coupon.type === "amount"
                            ? formatCurrency(coupon.value)
                            : `${coupon.value}%`}
                          )
                        </p>
                      )}
                      {couponStatus === "invalid" && (
                        <p className="text-sm text-red-600 mt-2">Invalid coupon code</p>
                      )}
                      {couponStatus === "used" && (
                        <p className="text-sm text-red-600 mt-2">Coupon has already been used</p>
                      )}
                      {couponStatus === "expired" && (
                        <p className="text-sm text-red-600 mt-2">Coupon has expired</p>
                      )}
                    </div>

                    {/* Order Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Regular Products (
                          {checkoutItems.reduce(
                            (sum, item) => sum + (item.cartOfferProductId ? 0 : item.quantity),
                            0
                          )}{" "}
                          items)
                        </span>
                        <span className="text-gray-900">{formatCurrency(regularProductsSubtotal)}</span>
                      </div>
                      {offerProductsTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Offer Product (
                            {checkoutItems.reduce(
                              (sum, item) => sum + (item.cartOfferProductId ? 1 : 0),
                              0
                            )}{" "}
                            item)
                          </span>
                          <span className="text-green-600">+{formatCurrency(offerProductsTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-medium border-t pt-2">
                        <span className="text-gray-700">Subtotal</span>
                        <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Charges</span>
                        <span className="text-gray-900">{formatCurrency(shippingAmount)}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">You Save</span>
                          <span className="text-green-600">-{formatCurrency(savings)}</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Coupon Discount ({coupon?.code})</span>
                          <span className="text-green-600">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleConfirmOrder}
                      className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-HOVER transition-colors disabled:opacity-50 flex items-center justify-center"
                      disabled={isSubmitting || isProcessingPayment || !selectedAddressId || checkoutItems.length === 0}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Processing Order...
                        </>
                      ) : (
                        "Confirm Order"
                      )}
                    </button>
                    <button
                      onClick={handleCancelCheckout}
                      className="w-full bg-white border border-red-500 text-red-500 py-3 rounded-md hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                      aria-label="Cancel checkout and return to homepage"
                      disabled={isSubmitting || isProcessingPayment}
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CheckoutLayout>
    </>
  );
};

export default CheckoutPage;