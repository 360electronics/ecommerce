// app/providers.tsx
'use client';

import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { CheckoutProvider } from '@/context/checkout-context';
import { ProfileProvider } from '@/context/profile-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <Suspense fallback={<div></div>}>

                <ProfileProvider>
                    <WishlistProvider>
                        <CheckoutProvider>
                            <CartProvider>
                                {children}
                            </CartProvider>
                        </CheckoutProvider>
                    </WishlistProvider>
                </ProfileProvider>
            </Suspense>
        </AuthProvider>
    );
}
