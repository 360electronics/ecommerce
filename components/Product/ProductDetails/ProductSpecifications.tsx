import type React from "react"
interface SpecificationItem {
  label: string
  value: string | React.ReactNode
}

interface SpecificationSection {
  title: string
  items: SpecificationItem[]
}

interface ProductSpecificationsProps {
  productName: string
  specifications: SpecificationSection[]
  className?: string
}

export default function ProductSpecifications({ productName, specifications, className }: ProductSpecificationsProps) {
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-4">Product Features & Specification</h2>
      <div className="border rounded-lg p-6">
        <p className="text-gray-600 mb-8">Specifications Of {productName}</p>

        {specifications.map((section, sectionIndex) => (
          <div key={sectionIndex} className={sectionIndex > 0 ? "mt-8 pt-8 border-t" : ""}>
            <h3 className="font-bold text-base mb-4">{section.title}</h3>
            <div>
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex py-2">
                  <div className="w-1/3 font-medium">{item.label}</div>
                  <div className="w-2/3">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
