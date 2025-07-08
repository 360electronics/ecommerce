'use client';

import { useProductStore } from '@/store/product-store';
import { FlattenedProduct } from '@/store/types';

interface ProductSpecificationsProps {
  className?: string;
}

export default function ProductSpecifications({ className }: ProductSpecificationsProps) {
  const { product } = useProductStore();

  // Type guard for specifications
  const isSpecificationArray = (
    specs: FlattenedProduct['productParent']['specifications']
  ): specs is Array<{
    groupName: string;
    fields: Array<{ fieldName: string; fieldValue: string }>;
  }> => {
    if (!Array.isArray(specs)) return false;

    return specs.every((spec) => {
      if (typeof spec !== 'object' || spec === null) return false;
      if (typeof spec.groupName !== 'string') return false;
      if (!Array.isArray(spec.fields)) return false;

      return spec.fields.every((field) => {
        if (typeof field !== 'object' || field === null) return false;
        return (
          typeof field.fieldName === 'string' &&
          typeof field.fieldValue === 'string'
        );
      });
    });
  };

  // Render a placeholder if product is null
  if (!product) {
    return (
      <div className={`${className}`}>
        <h2 className="md:text-4xl text-lg md:font-bold font-medium mb-4">Description</h2>
        <div className="border rounded-lg p-6 bg-gray-100">
          <h2 className="md:text-xl md:font-bold font-medium mb-4">Product Features & Specification</h2>
          <p className="text-gray-600 mb-8 text-sm md:text-base">Loading product specifications...</p>
          <div className="py-4">
            <p className="text-gray-500">No product details available.</p>
          </div>
        </div>
      </div>
    );
  }

  const specifications = product.productParent?.specifications;
  const hasSpecifications = specifications && isSpecificationArray(specifications) && specifications.length > 0;

  return (
    <div className={`${className}`}>
      <h2 className="md:text-4xl text-lg md:font-bold font-medium mb-4 ">Description</h2>
      <div className="border rounded-lg p-6 bg-gray-100">
        <h2 className="md:text-xl md:font-bold font-medium mb-4">Product Features & Specification</h2>
        <p className="text-gray-600 mb-8 text-sm md:text-base">Specifications Of {product.name}</p>

        {hasSpecifications ? (
          specifications.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-8 pt-8 border-t' : ''}>
              <h3 className="md:font-bold font-medium md:text-base text-sm mb-4">
                {section.groupName}
              </h3>
              <div>
                {section.fields.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="grid grid-cols-[1fr_1.5fr] gap-2 py-2 text-xs md:text-base"
                  >
                    <div className="font-medium">{item.fieldName}</div>
                    <div>{item.fieldValue}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-4">
            <p className="text-gray-500">
              No detailed specifications available for this product.
            </p>

            {(product.brand || product.material || product.dimensions || product.weight) && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="md:font-bold font-medium md:text-base text-sm mb-4">Basic Information</h3>
                <div>
                  {product.brand && (
                    <div className="grid grid-cols-[1fr_1.5fr] gap-2 py-2 text-xs md:text-base">
                      <div className="font-medium">Brand</div>
                      <div>{product.brand.name}</div>
                    </div>
                  )}
                  {product.material && (
                    <div className="grid grid-cols-[1fr_1.5fr] gap-2 py-2 text-xs md:text-base">
                      <div className="font-medium">Material</div>
                      <div>{product.material}</div>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="grid grid-cols-[1fr_1.5fr] gap-2 py-2 text-xs md:text-base">
                      <div className="font-medium">Dimensions</div>
                      <div>{product.dimensions}</div>
                    </div>
                  )}
                  {product.weight && (
                    <div className="grid grid-cols-[1fr_1.5fr] gap-2 py-2 text-xs md:text-base">
                      <div className="font-medium">Weight</div>
                      <div>{product.weight}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {product.description && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="md:font-bold font-medium md:text-base text-sm mb-4">Product Description</h3>
            <div className="text-gray-700 text-sm md:text-base whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}