//user-auth

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  role: 'user' | 'admin' | 'guest';
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchAuthStatus: () => Promise<void>;
  setAuth: (isLoggedIn: boolean, user: User | null) => void;
}

//cart
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    shortName: string;
    description: string | null;
    category: string;
    brand: string;
    status: 'active' | 'inactive';
    subProductStatus: 'active' | 'inactive';
    totalStocks: string;
    averageRating: string;
    ratingCount: string;
    createdAt: string;
    updatedAt: string;
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
    createdAt: string;
    updatedAt: string;
  };
}

export interface Coupon {
  id: string;
  code: string;
  type: 'amount' | 'percentage';
  value: number;
  couponId: string;
  couponType: 'individual' | 'special';
  isUsed?: boolean;
  expiryDate: string;
  createdAt: string;
  amount: number;
}

export interface CartState {
  cartItems: CartItem[];
  coupon: Coupon | null;
  couponStatus: 'none' | 'applied' | 'invalid' | 'used' | 'expired';
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  markCouponUsed: (code: string) => Promise<void>;
  clearCoupon: () => void;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getItemCount: () => number;
  getSavings: () => number;
}

//wishlist

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  createdAt: string;
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
  };
  product: {
    id: string;
    shortName: string;
    description: string | null;
    category: string;
    brand: string;
    status: 'active' | 'inactive';
    subProductStatus: 'active' | 'inactive';
    totalStocks: string;
    averageRating: string;
    ratingCount: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface WishlistState {
  wishlist: WishlistItem[];
  wishlistCount: number;
  isInWishlist: (productId: string, variantId: string) => boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string, variantId: string) => Promise<void>;
  removeFromWishlist: (productId: string, variantId: string) => Promise<void>;
}

//product

export interface FlattenedProduct {
  id: string;
  productId: string;
  name: string;
  mrp: number;
  ourPrice: number;
  averageRating: string;
  brand: string;
  category: string;
  color: string;
  createdAt: string;
  description: string | null;
  dimensions: string;
  material: string;
  productImages: string[];
  productParent: {
    averageRating: string;
    brand: string;
    category: string;
    createdAt: string;
    description: string | null;
    id: string;
    ratingCount: string;
    shortName: string;
    specifications: Array<{
      groupName: string;
      fields: Array<{ fieldName: string; fieldValue: string }>;
    }>;
    status: string;
    subProductStatus: string;
    tags: string[];
    totalStocks: string;
    updatedAt: string;
    variants: Array<{
      id: string;
      color: string;
      storage: string;
      slug: string;
      mrp: number;
      ourPrice: number;
      stock: string;
    }>;
  };
  sku: string;
  slug: string;
  stock: string;
  storage: string;
  tags: string[];
  totalStocks: string;
  updatedAt: string;
  weight: string;
  deliveryDate?: string;
  discount?: number;
}


//profile

export interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'home' | 'work' | 'other';
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string | null;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cod' | 'razorpay';
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Variant {
  id: string;
  productId: string; // Added missing productId
  name: string;
  sku: string;
  slug: string;
  color: string;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  mrp: string;
  ourPrice: string;
  storage: string | null;
  stock: string;
  productImages: string[];
  createdAt: string; // Added missing fields
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;
  product: Product | null;
  variant: Variant;
  unitPrice: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  brand: string;
  color: string | null;
  mrp: string;
  ourPrice: string | null;
  storage: string | null;
  status: 'active' | 'inactive';
  subProductStatus: 'active' | 'inactive';
  totalStocks: string;
  deliveryMode: 'standard' | 'express';
  productImages: string[];
  sku: string;
  weight: string | null;
  dimensions: string | null;
  material: string | null;
  tags: string;
  averageRating: string;
  ratingCount: string;
  createdAt: string;
  updatedAt: string;
}


export interface Referral {
  id: string;
  referredEmail: string;
  status: 'pending' | 'completed';
  signupDate: string;
  couponGenerated?: boolean;
}


export interface Ticket {
  id: string;
  type: string;
  issueDesc: string;
  status: 'active' | 'inactive' | 'resolved';
  createdAt: string;
  replies: Reply[];
}

export interface Reply {
  id: string;
  sender: 'user' | 'support';
  message: string;
  createdAt: string;
}