"use client"

import * as React from "react"

// Utility function to combine class names
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

// Types
type SelectContextValue = {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.MutableRefObject<HTMLElement | null>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
}

// Context
const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("useSelect must be used within a Select")
  }
  return context
}

// Root component
interface SelectProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Select: React.FC<SelectProps> = ({
  children,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (onValueChange) {
        onValueChange(newValue)
      } else {
        setUncontrolledValue(newValue)
      }
    },
    [onValueChange],
  )

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

  // Close select when clicking outside
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

  // Close select when pressing escape
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
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen, triggerRef, contentRef }}>
      {children}
    </SelectContext.Provider>
  )
}

// Value component (for display purposes)
const SelectValue: React.FC<{ placeholder?: number | string }> = ({ placeholder }) => {
  const { value } = useSelect()
  return <>{value || placeholder}</>
}
SelectValue.displayName = "SelectValue"

// Trigger component
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = useSelect()

    // Improved ref handling
    const handleRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        // Update the triggerRef
        if (node) {
          triggerRef.current = node
        }

        // Forward the ref
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef, triggerRef],
    )

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      props.onClick?.(e)
      setOpen(!open)
    }

    return (
      <button
        ref={handleRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? "select-content" : undefined}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 opacity-50"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    )
  },
)
SelectTrigger.displayName = "SelectTrigger"

// Content component
interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "popper" | "item-aligned"
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, position = "popper", children, ...props }, forwardedRef) => {
    const { open, contentRef, triggerRef } = useSelect()
    const [selectPosition, setSelectPosition] = React.useState({ top: 0, left: 0, width: 0 })

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
      if (!open || !triggerRef.current) return

      const updatePosition = () => {
        if (!triggerRef.current) return

        const triggerRect = triggerRef.current.getBoundingClientRect()

        setSelectPosition({
          top: triggerRect.bottom + 8 + window.scrollY,
          left: triggerRect.left + window.scrollX,
          width: triggerRect.width,
        })
      }

      updatePosition()

      // Update position on resize
      window.addEventListener("resize", updatePosition)
      return () => window.removeEventListener("resize", updatePosition)
    }, [open, triggerRef])

    if (!open) return null

    return (
      <div
        ref={handleRef}
        id="select-content"
        role="listbox"
        data-state={open ? "open" : "closed"}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        style={{
          position: "absolute",
          top: `${selectPosition.top}px`,
          left: `${selectPosition.left}px`,
          width: position === "popper" ? `${selectPosition.width}px` : undefined,
        }}
        {...props}
      >
        <div className="p-1 overflow-y-auto max-h-[var(--radix-select-content-available-height,300px)]">{children}</div>
      </div>
    )
  },
)
SelectContent.displayName = "SelectContent"

// Item component
interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, ...props }, ref) => {
    const { onValueChange, value: selectedValue, setOpen } = useSelect()
    const isSelected = selectedValue === value

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      onValueChange(value)
      setOpen(false)
      props.onClick?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onValueChange(value)
        setOpen(false)
      }
    }

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-selected={isSelected ? true : undefined}
        data-disabled={disabled ? true : undefined}
        tabIndex={disabled ? undefined : 0}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className,
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </span>
        <span className="truncate">{children}</span>
      </div>
    )
  },
)
SelectItem.displayName = "SelectItem"

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem }
