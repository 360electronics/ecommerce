'use client';
import { fetchProducts } from '@/utils/products.util';
import React, { useEffect, useState } from 'react';
import ProductCardwithCart from '../ProductCards/ProductCardwithCart';
import { FlattenedProduct } from '@/types/product';

// Define a type for the parent product returned by fetchProducts
interface ProductParent {
  id: string;
  shortName: string;
  fullName: string;
  slug: string;
  brand: { id: string; name: string } | string;
  category: { id: string; name: string } | string;
  variants: FlattenedProduct[];
}

interface SimilarProductsProps {
  product: FlattenedProduct | null;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({ product }) => {
  const [similarProducts, setSimilarProducts] = useState<FlattenedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSimilarProducts = async () => {
      // Validate input product
      if (!product || !product.ourPrice || !product.brand || !product.category) {
        console.warn('Invalid product data, skipping similar products fetch:', {
          productId: product?.id,
          ourPrice: product?.ourPrice,
          brand: product?.brand,
          category: product?.category,
        });
        setSimilarProducts([]);
        setLoading(false);
        return;
      }

      try {
        const allProducts = await fetchProducts();
        // console.log('Fetched products:', allProducts);

        // Validate allProducts is an array
        if (!Array.isArray(allProducts)) {
        //   console.error('fetchProducts returned a non-array response:', allProducts);
          setSimilarProducts([]);
          setLoading(false);
          return;
        }

        // Calculate dynamic price range (±20% of current product's price)
        const currentPrice = Number(product.ourPrice) || 0;
        const minPrice = currentPrice * 0.8; // 80% of current price
        const maxPrice = currentPrice * 1.2; // 120% of current price
        // console.log('Price range:', { currentPrice, minPrice, maxPrice });

        // Normalize brand and category from product (FlattenedProduct)
        // const productBrand = typeof product.brand === 'string' ? product.brand : product.brand?.name;
        const productCategory = typeof product.category === 'string' ? product.category : product.category?.name;

        // Flatten variants and filter
        const filteredVariants = allProducts
          .flatMap((p: ProductParent) => p.variants || [])
          .filter((variant: FlattenedProduct) => {
           

            // Get parent product to access brand and category
            const parent = allProducts.find((parent: ProductParent) =>
              parent.variants.some((v) => v.id === variant.id)
            );
            if (!parent) return false;

            // Normalize brand and category from parent
            const parentBrand = typeof parent.brand === 'string' ? parent.brand : parent.brand?.name;
            const parentCategory = typeof parent.category === 'string' ? parent.category : parent.category?.name;

            // const isSameBrand = parentBrand === productBrand;
            const isSameCategory = parentCategory === productCategory;
            const price = Number(variant.ourPrice);
            const isSimilarPrice = !isNaN(price) && price >= minPrice && price <= maxPrice;
            const isNotCurrentProduct = variant.id !== product.id;

            return isSameCategory && isSimilarPrice && isNotCurrentProduct;
          });

        // console.log('Filtered similar variants:', filteredVariants);

        // Limit to 4 similar products
        setSimilarProducts(filteredVariants.slice(0, 4));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching similar products:', error);
        setSimilarProducts([]);
        setLoading(false);
      }
    };

    loadSimilarProducts();
  }, [product]);

  if (loading) {
    return (
      <div className="mx-auto px-4 max-w-7xl">
        <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
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

  if (!similarProducts.length) {
    return (
      <div className="mx-auto px-4 max-w-7xl">
        <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
        <p className="text-gray-600">No similar products found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto py-12">
      <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {similarProducts.map((product) => (
          <ProductCardwithCart
            key={product.id}
            image={
              Array.isArray(product.productImages)
                ? (
                    product.productImages.find((img: { isFeatured?: boolean }) => img.isFeatured)?.url ||
                    product.productImages[0]?.url ||
                    ''
                  )
                : ''
            }
            name={product.name}
            rating={typeof product.averageRating === 'number' ? product.averageRating : Number(product.averageRating) || 0}
            ourPrice={typeof product.ourPrice === 'number' ? product.ourPrice : Number(product.ourPrice) || 0}
            mrp={typeof product.mrp === 'number' ? product.mrp : Number(product.mrp) || 0}
            slug={product.slug}
            productId={product.productId}
            variantId={product.id}
            showViewDetails={true}
            className="w-full"
          />
        ))}
      </div>
    </div>
  );
};

export default SimilarProducts;