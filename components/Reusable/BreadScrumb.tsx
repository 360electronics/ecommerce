import React from "react"
import Link from "next/link"
import { ChevronRight, House } from "lucide-react"


interface Breadcrumb {
  name: string
  path: string
  icon?: React.ElementType 
}

interface BreadcrumbsProps {
  breadcrumbs: Breadcrumb[],
  className?:string
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs,className }) => {
  return (
    <nav className={`md:flex items-center md:gap-2 ${className}`}>
      {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            { index === 0  && <House className="md:w-5 md:h-5 w-4 h-4 text-primary mr-2" />}
          {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />}
          <Link
            href={crumb.path}
            className={`md:text-sm text-xs ${
              index === breadcrumbs.length - 1
                ? "font-medium text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {crumb.name}
          </Link>
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumbs
