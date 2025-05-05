"use client"

import { useProductContext } from "@/context/product-context"

interface ProductSpecificationsProps {
  className?: string
}

export default function ProductSpecifications({ className }: ProductSpecificationsProps) {
  const { product } = useProductContext()

  return (
    <div className={`${className} `}>
      <h2 className="md:text-4xl text-lg md:font-bold font-medium mb-4">Description</h2>
      <div className="border rounded-lg p-6 bg-gray-100">
        <h2 className="md:text-xl md:font-bold font-medium mb-4">Product Features & Specification</h2>
        <p className="text-gray-600 mb-8 text-sm md:text-base">Specifications Of {product.name}</p>

        {product.specifications.map((section, sectionIndex) => (
          <div key={sectionIndex} className={sectionIndex > 0 ? "mt-8 pt-8 border-t" : ""}>
            <h3 className="md:font-bold font-medium md:text-base text-sm mb-4">{section.title}</h3>
            <div>
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="grid grid-cols-[1fr_1.5fr] gap-2 py-2 text-xs md:text-base">
                <div className="font-medium">{item.label}</div>
                <div>{item.value}</div>
              </div>
              
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
