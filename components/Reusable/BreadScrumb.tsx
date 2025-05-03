import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface Breadcrumb {
  name: string
  path: string
  icon?: React.ElementType 
}

interface BreadcrumbsProps {
  breadcrumbs: Breadcrumb[]
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs }) => {
  return (
    <nav className="flex items-center gap-2">
      {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            { index === 0 && crumb.icon && <crumb.icon className="w-5 h-5 text-primary mr-2" />}
          {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />}
          <Link
            href={crumb.path}
            className={`text-sm ${
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
