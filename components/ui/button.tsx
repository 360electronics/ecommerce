"use client"

import * as React from "react"

// Utility function to combine class names
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

// Button variants and sizes as plain objects
const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-gray-200 hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
}

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const buttonClasses = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      variants[variant],
      sizes[size],
      className,
    )

    // Fixed asChild implementation
    if (asChild && React.isValidElement(children)) {
      // Use type assertion to help TypeScript understand the element type
      const child = children as React.ReactElement<any>

      // Merge the child's existing className with our button classes
      const childClassName = cn(buttonClasses, child.props.className)

      // Create new props by merging our props with the child's props
      const newProps = {
        ...child.props,
        ...props,
        className: childClassName,
      }

      // Create a new element with the merged props and handle ref separately
      return React.createElement(child.type, {
        ...newProps,
        ref: (node: any) => {
          // Handle ref forwarding
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node

          // Forward to child's ref if it exists
          const childRef = (child as any).ref
          if (typeof childRef === "function") childRef(node)
          else if (childRef) childRef.current = node
        },
      })
    }

    return (
      <button className={`${buttonClasses} cursor-pointer`} ref={ref} {...props}>
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

export { Button }
