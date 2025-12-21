import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export type ProductImage = {
  length: number;
  url: string;
  alt: string;
  isFeatured: boolean;
  displayOrder: number;
};


// In CartItemComponent file
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  isOfferProduct?: boolean;
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
    color: string | null;
    material: string | null;
    dimensions: string | null; // Consider using ProductDimensions type if applicable
    weight: string | null;
    storage: string | null;
    stock: string;
    mrp: string;
    ourPrice: string;
    productImages: ProductImage[]; // Changed from string[] to ProductImage[]
    createdAt: string;
    updatedAt: string;
  };
}


export const CartItemComponent: React.FC<{
  item: CartItem;
  isUpdating: string | null;
  handleUpdateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  handleRemoveFromCart: (productId: string, variantId: string) => Promise<void>;
}> = ({ item, isUpdating, handleUpdateQuantity, handleRemoveFromCart }) => {
  const isLoading = isUpdating === item.id;

  return (
    <div className="w-full border-b border-gray-200 bg-white px-4 py-4">
      {/* Top Section */}
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative h-24 w-24 shrink-0 sm:h-36 sm:w-36">
          {item.isOfferProduct && (
            <span className="absolute left-1 top-1 z-10 rounded bg-green-500 px-2 py-0.5 text-[10px] font-medium text-white">
              Offer
            </span>
          )}

          <img
            src={item.variant.productImages?.[0]?.url ?? '/images/placeholder.jpg'}
            alt={item.variant.name}
            className="h-full w-full rounded-lg border object-contain p-2"
            loading="lazy"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <Link
              href={item.isOfferProduct ? '#' : `/product/${item.variant.slug}`}
              target='_blank'
              className={`block text-sm font-medium text-gray-900 line-clamp-1 sm:text-base sm:line-clamp-none ${
                item.isOfferProduct ? 'pointer-events-none' : ''
              }`}
            >
              {item.variant.name}
            </Link>

            {!item.isOfferProduct && (
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                {item.variant.color}
                {item.variant.storage && ` • ${item.variant.storage}`}
              </p>
            )}
          </div>

          {/* Quantity + Remove */}
          <div className="mt-3 flex items-center justify-between">
            {/* Quantity */}
            {!item.isOfferProduct ? (
              <div className="flex items-center gap-3 rounded-full border px-3 py-1.5 text-sm">
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || isLoading}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
                >
                  <Minus size={14} />
                </button>

                <span className="min-w-[16px] text-center font-medium">
                  {item.quantity}
                </span>

                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={
                    item.quantity >= Number(item.variant.stock) || isLoading
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                Qty: {item.quantity}
              </span>
            )}

            {/* Remove */}
            <button
              onClick={() =>
                handleRemoveFromCart(item.productId, item.variantId)
              }
              disabled={isLoading}
              className="rounded-full p-2 bg-red-200 text-red-400 hover:bg-red-300 hover:text-red-600 disabled:opacity-50 cursor-pointer"
              aria-label="Remove item"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="mt-3 flex justify-end">
        <div className="text-right">
          <p className="text-lg font-semibold sm:text-2xl">
            ₹
            {(Number(item.variant.ourPrice) * item.quantity).toLocaleString(
              'en-IN'
            )}
          </p>

          {!item.isOfferProduct && (
            <div className="mt-1 flex items-center justify-end gap-2">
              <span className="text-xs text-gray-400 line-through">
                ₹
                {(Number(item.variant.mrp) * item.quantity).toLocaleString(
                  'en-IN'
                )}
              </span>
              <span className="rounded-full bg-offer px-2 py-0.5 text-[10px] font-medium text-white">
                {Math.round(
                  ((Number(item.variant.mrp) -
                    Number(item.variant.ourPrice)) /
                    Number(item.variant.mrp)) *
                    100
                )}
                % OFF
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
