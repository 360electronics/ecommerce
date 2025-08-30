'use client';

import React, { useEffect, useState } from 'react';
import ProductCardwithCart from '../ProductCards/ProductCardwithCart';
import { FlattenedProduct } from '@/types/product';
import { fetchOfferZoneProducts } from '@/utils/products.util';

const OfferProducts = () => {
    const [offerProducts, setOfferProducts] = useState<FlattenedProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchOfferZoneProducts();

            // Flatten the API response
            const flattened: FlattenedProduct[] = data.map((item: any) => {
                const product = item.product || {};
                const variant = item.variant || {};
                const images = variant.productImages || [];

                return {
                    id: variant.id,
                    productId: variant.productId,
                    name: variant.name || product.fullName || '',
                    slug: variant.slug || product.slug || '',
                    averageRating: Number(product.averageRating || 0),
                    ourPrice: Number(variant.ourPrice || 0),
                    mrp: Number(variant.mrp || 0),
                    productImages: images.map((img: any) => ({
                        url: img.url,
                        isFeatured: img.isFeatured || false,
                    })),
                };
            });

            setOfferProducts(flattened);
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6">Offer Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="animate-pulse">
                            <div className="bg-gray-200 h-48 w-full rounded-lg mb-4" />
                            <div className="bg-gray-200 h-6 w-3/4 rounded mb-2" />
                            <div className="bg-gray-200 h-4 w-1/2 rounded mb-2" />
                            <div className="bg-gray-200 h-4 w-1/3 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!offerProducts.length) {
        return (
            <div className="mx-auto">
                <h2 className="text-2xl font-medium mb-6">Offer Products</h2>
                <p className="text-gray-600">No similar offer found.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto py-10">
            <h2 className="text-2xl font-medium mb-6">Offer Products</h2>
            <div className="flex overflow-x-auto pb-10 snap-x snap-mandatory minimal-scrollbar">
                {offerProducts.map((product) => (
                    <div
                        className="snap-start flex-shrink-0 relative"
                        style={{ width: 'calc(60vw - 32px)', maxWidth: '18rem' }}
                    >

                        <ProductCardwithCart
                            key={product.id}
                            image={
                                Array.isArray(product.productImages)
                                    ? (
                                        product.productImages.find((img: { isFeatured?: boolean; url?: string }) => !!img.isFeatured)?.url ||
                                        product.productImages[0]?.url ||
                                        ''
                                    )
                                    : ''
                            }
                            name={product.name}
                            rating={typeof product.averageRating === 'number' ? product.averageRating : 0}
                            ourPrice={Number(product.ourPrice)}
                            mrp={Number(product.mrp)}
                            slug={product.slug}
                            productId={product.productId}
                            variantId={product.id}
                            showViewDetails={true}
                            className="w-full h-full"
                            status={product.status}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OfferProducts;
