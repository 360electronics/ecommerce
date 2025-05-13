// app/providers.tsx
'use client';

import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { ProfileProvider } from '@/context/profile-context';
import { WishlistProvider } from '@/context/wishlist-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ProfileProvider>
                <WishlistProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </WishlistProvider>
            </ProfileProvider>
        </AuthProvider>
    );
}
