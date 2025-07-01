export const addToWishlist = async (userId: string, productId: string, variantId: string) => {
    try {
        const res = await fetch('/api/users/wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, productId , variantId}),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to add to wishlist');
        }

        // console.log(data)

        return {
            success: true,
            message: data.message,
            item: data.item,
        };
    } catch (error) {
        console.error('Error in addToWishlist:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};


export const removeFromWishlist = async (userId: string, productId: string, variantId: string) => {
    try {
        const res = await fetch(
            `/api/users/wishlist?userId=${userId}&productId=${productId}&variantId=${variantId}`,
            {
                method: "DELETE",
            }
        );
        const data = await res.json();
        return { success: res.ok, message: data.message };
    } catch (error) {
        return { success: false, message: "Error removing from wishlist" };
    }
};