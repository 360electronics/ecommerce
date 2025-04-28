"use client"

import * as React from "react"

// Utility function to combine class names
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "defaultChecked"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onCheckedChange, disabled, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState<boolean>(checked || defaultChecked || false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Update internal state when checked prop changes
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])

    const handleClick = () => {
      if (disabled) return

      const newChecked = !isChecked

      // Only update internal state if not controlled
      if (checked === undefined) {
        setIsChecked(newChecked)
      }

      onCheckedChange?.(newChecked)

      // Programmatically check/uncheck the hidden input for form submission
      if (inputRef.current) {
        inputRef.current.checked = newChecked

        // Dispatch change event for form validation
        const event = new Event("change", { bubbles: true })
        inputRef.current.dispatchEvent(event)
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault()
        handleClick()
      }
    }

    return (
      <div
        ref={ref}
        role="checkbox"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        aria-disabled={disabled}
        tabIndex={disabled ? undefined : 0}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isChecked && "bg-primary text-primary-foreground",
          className,
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {isChecked && (
          <div className="flex h-full items-center justify-center text-current">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-white"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        <input
          ref={inputRef}
          type="checkbox"
          aria-hidden="true"
          tabIndex={-1}
          defaultChecked={defaultChecked}
          checked={checked}
          disabled={disabled}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          {...props}
        />
      </div>
    )
  },
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
