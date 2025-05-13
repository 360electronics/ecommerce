import ProductImageGallery from './ProductImageGallery';
import ProductDetailsContent from './ProductDetailsContent';
import ProductSpecifications from './ProductSpecifications';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import { ProductProvider } from '@/context/product-context';
import ProductZoomOverlay from './ProductZoomOverlay';

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

interface ProductDetailPageProps {
  product: FlattenedProduct;
}

export default function ProductDetailPage({ product }: ProductDetailPageProps) {
  // Prepare breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    {
      name: product.category,
      path: `/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`,
    },
    { name: product.name, path: '' },
  ];

  return (
    <ProductProvider product={product}>
      <div className="mx-auto px-4 pb-8">
        <Breadcrumbs breadcrumbs={breadcrumbItems} className="my-6 hidden md:block" />

        <div className="flex flex-col md:flex-row md:mb-12 mb-1 relative">
          <div className="w-full md:w-[40%]">
            <ProductImageGallery />
          </div>

          <div className="w-full md:w-[60%] product-details">
            <ProductDetailsContent />
            <ProductZoomOverlay className="hidden md:block" />
          </div>
        </div>

        <ProductSpecifications className="mb-12" />

        {/* <ProductRatingsReviews /> */}
      </div>
    </ProductProvider>
  );
}