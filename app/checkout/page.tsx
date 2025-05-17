'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/Layouts/UserLayout';
import CheckoutLayout from '@/components/Layouts/CheckoutLayout';
import toast from 'react-hot-toast';
import { Plus, Check, Truck, CreditCard, IndianRupee as Cash, Loader2 } from 'lucide-react';
import Script from 'next/script';
import { useAuthStore } from '@/store/auth-store';
import { useCheckoutStore } from '@/store/checkout-store';
import { useCartStore } from '@/store/cart-store';

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
  addressType: 'home' | 'work' | 'other';
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
  const [deliveryMode, setDeliveryMode] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); 
  const [couponCode, setCouponCode] = useState('');

  

  // New address form state
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressType: 'home' as 'home' | 'work' | 'other',
    isDefault: false,
  });

  // Fetch addresses
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      const fetchAddresses = async () => {
        try {
          const response = await fetch(`/api/users/addresses?userId=${user.id}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Failed to fetch addresses');
          const data: Address[] = await response.json();
          setAddresses(data);
          const defaultAddress = data.find((addr) => addr.isDefault);
          setSelectedAddressId(defaultAddress ? defaultAddress.id : data[0]?.id || null);
        } catch (error) {
          console.error('Error fetching addresses:', error);
          toast.error('Failed to fetch addresses');
        }
      };
      fetchAddresses();
    }
  }, [isLoggedIn, user?.id]);

  // Fetch checkout items
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchCheckoutItems(user.id).then(() => {
        if (checkoutItems.length === 0) {
          toast.error('Your checkout is empty');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      });
    }
  }, [isLoggedIn, user?.id, fetchCheckoutItems, router]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      toast.error('Please log in to proceed to checkout');
      router.push('/login');
    }
  }, [isLoading, isLoggedIn, router]);

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
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user!.id,
          ...newAddress,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save address');
      }
      const savedAddress: Address = await response.json();
      setAddresses([...addresses, savedAddress]);
      setSelectedAddressId(savedAddress.id);
      setShowAddressForm(false);
      setNewAddress({
        fullName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: 'home',
        isDefault: false,
      });
      toast.success('Address added successfully');
    } catch (error: any) {
      console.error('Error adding address:', error);
      toast.error(error.message || 'Failed to save address');
    }
  };

  // Handle cancel checkout
  const handleCancelCheckout = async () => {
    try {
      await clearCheckout(user!.id);
      toast.success('Checkout cancelled');
      router.push('/');
    } catch (error) {
      console.error('Error cancelling checkout:', error);
      toast.error('Failed to cancel checkout');
    }
  };

  // Handle apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast.error('Please enter a coupon code');
      return;
    }
    await applyCoupon(couponCode);
    setCouponCode('');
  };

  // Check if express delivery is available
  const isExpressAvailable = checkoutItems.some(
    (item) => item.product.deliveryMode === 'express' || item.product.deliveryMode === 'both'
  );

  // Calculate estimated delivery dates
  const getEstimatedDeliveryDate = (mode: 'standard' | 'express') => {
    const today = new Date('2025-05-14T22:44:00+05:30'); // Updated to 10:44 PM IST
    const daysToAdd = mode === 'standard' ? 7 : 2;
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + daysToAdd);
    return estimatedDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = checkoutItems.reduce(
      (sum, item) => sum + Number(item.variant.ourPrice) * item.quantity,
      0
    );
    const savings = checkoutItems.reduce(
      (total, item) =>
        total + (Number(item.variant.mrp) - Number(item.variant.ourPrice)) * item.quantity,
      0
    );
    const discountAmount =
      coupon && couponStatus === 'applied'
        ? coupon.type === 'amount'
          ? coupon.value
          : (subtotal * coupon.value) / 100
        : 0;
    const shippingAmount =
      subtotal > 500 && deliveryMode === 'standard'
        ? 0
        : checkoutItems.reduce(
            (sum, item) => sum + (deliveryMode === 'standard' ? 50 : 79) * item.quantity,
            0
          );
    const grandTotal = Math.max(0, subtotal - discountAmount) + shippingAmount;
    return { subtotal, savings, discountAmount, shippingAmount, grandTotal };
  };

  const { subtotal, savings, discountAmount, shippingAmount, grandTotal } = calculateTotals();

  // Handle Razorpay payment
  const initiateRazorpayPayment = async (order: {
    id: string;
    totalAmount: number;
    razorpayOrderId?: string;
  }) => {
    try {
      const shortOrderId = order.id.slice(0, 36);
      const receipt = `ord_${shortOrderId}`;

      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(grandTotal * 100),
          currency: 'INR',
          receipt: receipt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }

      const { razorpayOrderId } = await response.json();

      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay key is not configured');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(grandTotal * 100),
        currency: 'INR',
        name: '360 Electronics',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Show processing UI after modal closes
            setIsProcessingPayment(true);

            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.id,
                userId: user!.id,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            // Update order status to confirmed
            const updateResponse = await fetch('/api/orders/update-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                status: 'confirmed',
                paymentStatus: 'paid',
              }),
            });

            if (!updateResponse.ok) {
              throw new Error('Failed to update order status');
            }

            // Mark coupon as used if applied
            if (coupon && coupon.code && couponStatus === 'applied') {
              await markCouponUsed(coupon.code);
            }

            // Clear coupon in frontend
            clearCoupon();
            await clearCheckout(user!.id);
            toast.success('Payment successful!');
            router.push('/profile?tab=orders');
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.firstName + ' ' + user?.lastName || '',
          email: user?.email || '',
          contact: addresses.find((addr) => addr.id === selectedAddressId)?.phoneNumber || '',
        },
        notes: {
          order_id: order.id,
        },
        theme: {
          color: '#2563eb',
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', async (response: any) => {
        console.error('Payment failed:', response.error);
        toast.error('Payment failed. Please try again.');
        await fetch('/api/orders/update-payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            paymentStatus: 'failed',
          }),
        });
        setIsProcessingPayment(false);
      });

      return razorpayOrderId;
    } catch (error: any) {
      console.error('Error initiating Razorpay payment:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setIsProcessingPayment(false);
      return null;
    }
  };

  // Handle order confirmation
  const handleConfirmOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    if (!checkoutItems.length) {
      toast.error('Your checkout is empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = {
        userId: user!.id,
        addressId: selectedAddressId,
        totalAmount: grandTotal,
        discountAmount: discountAmount,
        couponCode: coupon && couponStatus === 'applied' ? coupon.code : null,
        shippingAmount,
        deliveryMode,
        paymentMethod,
        status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        orderItems: checkoutItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.variant.ourPrice,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const createdOrder = await response.json();

      if (paymentMethod === 'razorpay') {
        const razorpayOrderId = await initiateRazorpayPayment({
          id: createdOrder.id,
          totalAmount: grandTotal,
        });

        if (!razorpayOrderId) {
          throw new Error('Failed to initiate Razorpay payment');
        }

        await fetch('/api/orders/update-razorpay-order-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createdOrder.id,
            razorpayOrderId,
          }),
        });
      } else {
        // For COD, mark coupon as used and update status
        if (coupon && coupon.code && couponStatus === 'applied') {
          await markCouponUsed(coupon.code);
        }
        await fetch('/api/orders/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createdOrder.id,
            status: 'confirmed',
            paymentStatus: 'pending',
          }),
        });
        // Clear coupon in frontend
        clearCoupon();
        await clearCheckout(user!.id);
        toast.success('Order placed successfully!');
        router.push('/orders');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <CheckoutLayout>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {/* Post-Payment Processing Overlay */}
          {isProcessingPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                <p className="text-lg font-medium text-gray-900">
                  Please wait, processing your order...
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 ">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
                {addresses.length === 0 && !showAddressForm ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">No saved addresses found.</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
                          className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                            selectedAddressId === address.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => setSelectedAddressId(address.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{address.fullName}</p>
                              <p className="text-sm text-gray-600">{address.phoneNumber}</p>
                              <p className="text-sm text-gray-600">
                                {address.addressLine1}
                                {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city},{' '}
                                {address.state} {address.postalCode}, {address.country}
                              </p>
                              <p className="text-sm text-gray-600 capitalize">{address.addressType}</p>
                              {address.isDefault && (
                                <p className="text-sm text-blue-600 font-medium">Default</p>
                              )}
                            </div>
                            {selectedAddressId === address.id && (
                              <Check className="text-blue-600 h-5 w-5" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {!showAddressForm && (
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
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
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
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
                            setNewAddress({ ...newAddress, addressType: e.target.value as 'home' | 'work' | 'other' })
                          }
                          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                          Set as default
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
              <div className="bg-white border border-gray-200 rounded-lg p-6 ">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Mode</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      deliveryMode === 'standard'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setDeliveryMode('standard')}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="h-6 w-6 text-gray-600" />
                      <div>
                        <p className="text-gray-900 font-medium">
                          Standard Delivery ({subtotal > 500 ? 'Free' : '₹50/item'})
                        </p>
                        <p className="text-sm text-gray-600">
                          Estimated delivery by {getEstimatedDeliveryDate('standard')}
                        </p>
                        <p className="text-sm text-gray-500">Reliable and cost-effective shipping</p>
                      </div>
                    </div>
                    {deliveryMode === 'standard' && (
                      <Check className="absolute right-4 top-4 text-blue-600 h-5 w-5" />
                    )}
                  </div>
                  {isExpressAvailable && (
                    <div
                      className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        deliveryMode === 'express'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setDeliveryMode('express')}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="text-gray-900 font-medium">Express Delivery (₹79/item)</p>
                          <p className="text-sm text-gray-600">
                            Estimated delivery by {getEstimatedDeliveryDate('express')}
                          </p>
                          <p className="text-sm text-gray-500">Fast and priority shipping</p>
                        </div>
                      </div>
                      {deliveryMode === 'express' && (
                        <Check className="absolute right-4 top-4 text-blue-600 h-5 w-5" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 ">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'cod'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="flex items-center gap-3">
                      <Cash className="h-6 w-6 text-gray-600" />
                      <div>
                        <p className="text-gray-900 font-medium">Cash on Delivery (COD)</p>
                        <p className="text-sm text-gray-500">Pay when you receive your order</p>
                      </div>
                    </div>
                    {paymentMethod === 'cod' && (
                      <Check className="absolute right-4 top-4 text-blue-600 h-5 w-5" />
                    )}
                  </div>
                  <div
                    className={`border relative rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'razorpay'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setPaymentMethod('razorpay')}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-gray-600" />
                      <div>
                        <p className="text-gray-900 font-medium">Pay with Razorpay</p>
                        <p className="text-sm text-gray-500">Secure online payment with UPI/Card</p>
                      </div>
                    </div>
                    {paymentMethod === 'razorpay' && (
                      <Check className="absolute right-4 top-4 text-blue-600 h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6  sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 nohemi-bold">Order Summary</h2>
                <div className="space-y-4">
                  <div className="space-y-4">
                    {checkoutItems.map((item) => (
                      <div key={item.variantId} className="flex gap-4">
                        <img
                          src={item.variant.productImages[0] || '/placeholder.png'}
                          alt={item.product.shortName}
                          className="w-16 h-16 object-contain rounded-md"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.product.shortName}
                          </p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium text-gray-900">
                            ₹{(Number(item.variant.ourPrice) * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
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
                          className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={couponStatus === 'applied'}
                        />
                        {coupon && couponStatus === 'applied' ? (
                          <button
                            onClick={removeCoupon}
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={handleApplyCoupon}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {couponStatus === 'applied' && coupon && (
                        <p className="text-sm text-green-600 mt-2">
                          Coupon {coupon.code} applied (
                          {coupon.type === 'amount'
                            ? `₹${coupon.value.toLocaleString('en-IN')}`
                            : `${coupon.value}%`}
                          )
                        </p>
                      )}
                      {couponStatus === 'invalid' && (
                        <p className="text-sm text-red-600 mt-2">Invalid coupon code</p>
                      )}
                      {couponStatus === 'used' && (
                        <p className="text-sm text-red-600 mt-2">Coupon has already been used</p>
                      )}
                      {couponStatus === 'expired' && (
                        <p className="text-sm text-red-600 mt-2">Coupon has expired</p>
                      )}
                    </div>

                    {/* Order Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Price ({checkoutItems.reduce((sum, item) => sum + item.quantity, 0)} items)
                        </span>
                        <span className="text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Charges</span>
                        <span className="text-gray-900">₹{shippingAmount.toLocaleString('en-IN')}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">You Save</span>
                          <span className="text-green-600">₹{savings.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Coupon Discount ({coupon?.code})
                          </span>
                          <span className="text-green-600">
                            -₹{discountAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleConfirmOrder}
                      className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                      disabled={isSubmitting || isProcessingPayment || !selectedAddressId || checkoutItems.length === 0}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Processing Order...
                        </>
                      ) : (
                        'Confirm Order'
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