"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
})
Avatar.displayName = "Avatar"

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt = "", ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false)

    const handleError = () => {
      setHasError(true)
    }

    if (hasError) {
      return null
    }

    return (
      <img
        ref={ref}
        src={src || "/placeholder.svg"}
        alt={alt}
        onError={handleError}
        className={cn("aspect-square h-full w-full object-cover", className)}
        {...props}
      />
    )
  },
)
AvatarImage.displayName = "AvatarImage"

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  delayMs?: number
}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, children, delayMs = 600, ...props }, ref) => {
    const [isShown, setIsShown] = React.useState(false)

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsShown(true)
      }, delayMs)

      return () => clearTimeout(timer)
    }, [delayMs])

    if (!isShown) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-700 font-medium",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
