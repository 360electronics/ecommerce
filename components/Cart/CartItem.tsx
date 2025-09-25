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
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white w-full border-b border-gray-200 transition-shadow">
      {/* Image */}
      <div className="w-full sm:w-[20%] h-auto relative">
        {item.isOfferProduct && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Offer Product
          </span>
        )}
        <img
          src={item.variant.productImages?.[0].url ?? '/images/placeholder.jpg'}
          alt={`${item.product.shortName} (${item.variant.name})`}
          width={150}
          height={150}
          className="rounded-md object-contain border p-2 w-full h-full aspect-square"
          loading="lazy"
        />
      </div>

      {/* Info + Controls */}
      <div className="flex-1 w-full sm:w-[60%] flex flex-col justify-between">
        <div>
          <Link
            href={item.isOfferProduct ? '#' : `/products/${item.variant.slug}`}
            className={`text-base font-medium text-gray-900 block ${item.isOfferProduct ? 'pointer-events-none' : ''}`}
          >
            {item.variant.name}
          </Link>
          {!item.isOfferProduct && (
            <p className="text-sm text-gray-500 mt-1">
              {item.variant.color}
              {item.variant.storage && `, ${item.variant.storage}`}
            </p>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-start gap-4 mt-4">
          {!item.isOfferProduct ? (
            <div className="flex items-center gap-2 border rounded-full text-sm p-2">
              Qty.
              <button
                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 cursor-pointer transition-colors"
                disabled={item.quantity <= 1 || isUpdating === item.id}
                aria-label={`Decrease quantity of ${item.product.shortName} (${item.variant.name})`}
              >
                <Minus size={12} />
              </button>
              {isUpdating === item.id ? (
                <span className="w-4 text-center text-sm text-gray-500">{item.quantity}</span>
              ) : (
                <input
                  type="text"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (
                      !Number.isNaN(value) &&
                      value >= 1 &&
                      value <= parseInt(item.variant.stock)
                    ) {
                      handleUpdateQuantity(item.id, value);
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || Number.isNaN(parseInt(e.target.value))) {
                      handleUpdateQuantity(item.id, 1);
                    }
                  }}
                  className="w-8 text-center text-xs focus:outline-none"
                  min="1"
                  max={parseInt(item.variant.stock)}
                  disabled={isUpdating === item.id}
                  aria-label={`Quantity of ${item.product.shortName} (${item.variant.name})`}
                />
              )}
              <button
                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 cursor-pointer transition-colors"
                disabled={item.quantity >= parseInt(item.variant.stock) || isUpdating === item.id}
                aria-label={`Increase quantity of ${item.product.shortName} (${item.variant.name})`}
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
          )}

          <div className="hidden sm:block w-1 h-12 border-l-2"></div>

          <button
            onClick={() => handleRemoveFromCart(item.productId, item.variantId)}
            className="bg-red-200 border border-offer text-offer p-2 rounded-full hover:text-red-600 disabled:opacity-50 cursor-pointer transition-colors"
            disabled={isUpdating === item.id}
            aria-label={`Remove ${item.product.shortName} (${item.variant.name}) from cart`}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="w-full sm:w-[20%] mt-4 sm:mt-0 flex sm:block justify-between items-end">
        <p className="text-base text-end text-gray-900 flex flex-col">
          <span className="text-2xl sm:text-3xl font-medium nohemi-bold">
            ₹{(parseFloat(item.variant.ourPrice) * item.quantity).toLocaleString('en-IN')}
          </span>
        </p>
        {!item.isOfferProduct && item.variant.mrp && item.variant.ourPrice && (
          <p className="flex flex-col sm:flex-row items-center justify-end gap-2 mt-2">
            <span className="text-gray-400 line-through font-light text-xs">
              MRP: ₹{(parseFloat(item.variant.mrp) * item.quantity).toLocaleString('en-IN')}
            </span>
            <span className="rounded-full bg-offer px-2 py-1 text-xs font-medium text-white">
              {`${Math.round(
                ((Number(item.variant.mrp) - Number(item.variant.ourPrice)) /
                  Number(item.variant.mrp)) * 100
              )}% Off`}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};