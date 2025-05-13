'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

// Type definitions based on api/cart/route.ts and schemas
interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    id: string;
    shortName: string;
    description: string | null;
    category: string;
    brand: string;
    status: 'active' | 'inactive';
    subProductStatus: 'active' | 'inactive';
    totalStocks: string;
    deliveryMode: 'standard' | 'express';
    tags: string | null;
    averageRating: string;
    ratingCount: string;
    createdAt: Date;
    updatedAt: Date;
  };
  variant: {
    id: string;
    productId: string;
    name: string;
    sku: string;
    slug: string;
    color: string;
    material: string | null;
    dimensions: string | null;
    weight: string | null;
    storage: string | null;
    stock: string;
    mrp: string;
    ourPrice: string;
    productImages: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const TAX_RATE = 0.1; // 10% tax, configurable

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from API on mount, fallback to localStorage
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch('/api/cart', {
          headers: { 'x-user-id': 'user123' }, // Replace with auth
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data.cartItems);
        } else {
          // Fallback to localStorage
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            setCartItems(JSON.parse(savedCart));
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        toast.error('Failed to load cart.');
        // Fallback to localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      }
    };
    fetchCart();
  }, []);

  // Save cart to localStorage as backup
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = async (productId: string, variantId: string, quantity: number = 1) => {
    try {
      // Validate stock via API
      const response = await fetch(`/api/cart?productId=${productId}&variantId=${variantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user123', // Replace with auth
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add item to cart.');
        return;
      }

      const newItem: CartItem = await response.json();
      setCartItems((prevItems) => {
        const existingItem = prevItems.find(
          (item) => item.productId === productId && item.variantId === variantId
        );
        if (existingItem) {
          return prevItems.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        toast.success(`${newItem.product.shortName} (${newItem.variant.name}) added to cart!`);
        return [...prevItems, newItem];
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart.');
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const response = await fetch(`/api/cart?cartItemId=${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user123', // Replace with auth
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update quantity.');
        return;
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity.');
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const response = await fetch(`/api/cart?cartItemId=${cartItemId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'user123' }, // Replace with auth
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to remove item from cart.');
        return;
      }

      setCartItems((prevItems) => {
        const updatedItems = prevItems.filter((item) => item.id !== cartItemId);
        toast.success('Item removed from cart.');
        return updatedItems;
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart.');
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'x-user-id': 'user123' }, // Replace with auth
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to clear cart.');
        return;
      }

      setCartItems([]);
      toast.success('Cart cleared.');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart.');
    }
  };

  const getCartSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + parseFloat(item.variant.ourPrice) * item.quantity,
      0
    );
  };

  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    const tax = subtotal * TAX_RATE;
    return subtotal + tax;
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartSubtotal,
        getCartTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};