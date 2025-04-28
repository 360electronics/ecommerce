"use client"

import * as React from "react"

// Utility function to combine class names
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

// Types
type DropdownMenuContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.MutableRefObject<HTMLElement | null>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
}

// Context
const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("useDropdownMenu must be used within a DropdownMenu")
  }
  return context
}

// Root component
interface DropdownMenuProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const newValue = typeof value === "function" ? value(open) : value
      if (onOpenChange) {
        onOpenChange(newValue)
      } else {
        setUncontrolledOpen(newValue)
      }
    },
    [onOpenChange, open],
  )

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!open) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (!triggerRef.current?.contains(event.target as Node) && !contentRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [open, setOpen])

  // Close dropdown when pressing escape
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, setOpen])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

// Trigger component
interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild, children, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = useDropdownMenu()

    // Handle click event
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      props.onClick?.(e)
      setOpen(!open)
    }

    // Fixed asChild implementation
    if (asChild && React.isValidElement(children)) {
      // Use type assertion to help TypeScript understand the element type
      const child = children as React.ReactElement<any>

      // Create new props by merging our props with the child's props
      const newProps = {
        ...child.props,
        ...props,
        "aria-expanded": open,
        "aria-haspopup": true,
        onClick: (e: React.MouseEvent) => {
          child.props.onClick?.(e)
          handleClick(e as React.MouseEvent<HTMLButtonElement>)
        },
      }

      // Create a new element with the merged props and handle ref separately
      return React.createElement(child.type, {
        ...newProps,
        ref: (node: any) => {
          // Store in our triggerRef
          if (node) triggerRef.current = node

          // Forward to our ref
          if (typeof forwardedRef === "function") forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node

          // Forward to child's ref if it exists
          const childRef = (child as any).ref
          if (typeof childRef === "function") childRef(node)
          else if (childRef) childRef.current = node
        },
      })
    }

    // Regular button implementation
    return (
      <button
        ref={(node) => {
          if (node) triggerRef.current = node
          if (typeof forwardedRef === "function") forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        type="button"
        aria-expanded={open}
        aria-haspopup={true}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  },
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

// Content component
interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, sideOffset = 4, align = "end", side = "bottom", children, ...props }, forwardedRef) => {
    const { open, contentRef, triggerRef } = useDropdownMenu()
    const [position, setPosition] = React.useState({ top: 0, left: 0 })

    // Improved ref handling
    const handleRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        // Update the contentRef
        if (node) {
          contentRef.current = node
        }

        // Forward the ref
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef, contentRef],
    )

    // Calculate position based on trigger element
    React.useEffect(() => {
      if (!open || !triggerRef.current || !contentRef.current) return

      const updatePosition = () => {
        if (!triggerRef.current || !contentRef.current) return

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const contentRect = contentRef.current.getBoundingClientRect()

        let top = 0
        let left = 0

        // Vertical positioning
        if (side === "bottom") {
          top = triggerRect.bottom + sideOffset + window.scrollY
        } else if (side === "top") {
          top = triggerRect.top - contentRect.height - sideOffset + window.scrollY
        } else if (side === "left" || side === "right") {
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2 + window.scrollY
        }

        // Horizontal positioning
        if (side === "right") {
          left = triggerRect.right + sideOffset + window.scrollX
        } else if (side === "left") {
          left = triggerRect.left - contentRect.width - sideOffset + window.scrollX
        } else {
          if (align === "start") {
            left = triggerRect.left + window.scrollX
          } else if (align === "center") {
            left = triggerRect.left + (triggerRect.width - contentRect.width) / 2 + window.scrollX
          } else if (align === "end") {
            left = triggerRect.right - contentRect.width + window.scrollX
          }
        }

        // Adjust for viewport boundaries
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        if (left < 0) left = 0
        if (top < 0) top = 0
        if (left + contentRect.width > viewportWidth) {
          left = viewportWidth - contentRect.width
        }
        if (top + contentRect.height > viewportHeight) {
          top = viewportHeight - contentRect.height
        }

        setPosition({ top, left })
      }

      updatePosition()

      // Update position on resize
      window.addEventListener("resize", updatePosition)
      return () => window.removeEventListener("resize", updatePosition)
    }, [open, triggerRef, contentRef, sideOffset, align, side])

    if (!open) return null

    return (
      <div
        ref={handleRef}
        role="menu"
        aria-orientation="vertical"
        data-state={open ? "open" : "closed"}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        style={{
          position: "absolute",
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)
DropdownMenuContent.displayName = "DropdownMenuContent"

// Item component
interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
  disabled?: boolean
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, inset, disabled, children, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenu()

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      onClick?.(e)
      setOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onClick?.(e as any)
        setOpen(false)
      }
    }

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? undefined : 0}
        aria-disabled={disabled}
        data-disabled={disabled ? true : undefined}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          inset && "pl-8",
          className,
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    )
  },
)
DropdownMenuItem.displayName = "DropdownMenuItem"

// Separator component
const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} role="separator" {...props} />
  ),
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
