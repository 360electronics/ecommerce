"use client"

import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

// Create context for dialog state
type DialogContextType = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

// Custom hook to use dialog context
function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog component")
  }
  return context
}

// Main Dialog component
interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  // Create context value
  const [isOpen, setIsOpen] = useState(open)

  // Sync internal state with props
  useEffect(() => {
    setIsOpen(open)
  }, [open])

  // Sync props with internal state
  useEffect(() => {
    if (isOpen !== open) {
      onOpenChange(isOpen)
    }
  }, [isOpen, onOpenChange, open])

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return <DialogContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>{children}</DialogContext.Provider>
}

// Dialog Content component
interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

export function DialogContent({ children, className = "" }: DialogContentProps) {
  const { open, setOpen } = useDialogContext()
  const ref = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    // Handle escape key to close
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick)
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [open, setOpen])

  // Use portal to render dialog outside of parent component
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={ref}
        className={`relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg animate-in fade-in-0 zoom-in-95 ${className}`}
      >
        {children}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          aria-label="Close"
        >
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
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  )
}

// Dialog Header component
interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

export function DialogHeader({ children, className = "" }: DialogHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

// Dialog Title component
interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function DialogTitle({ children, className = "" }: DialogTitleProps) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>
}

// Dialog Footer component
interface DialogFooterProps {
  children: React.ReactNode
  className?: string
}

export function DialogFooter({ children, className = "" }: DialogFooterProps) {
  return (
    <div className={`mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>
  )
}

// Add animations
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}

.animate-in {
  animation-duration: 150ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

.fade-in-0 {
  animation-name: fadeIn;
}

.zoom-in-95 {
  animation-name: zoomIn;
}
`

// Add styles to document
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}
