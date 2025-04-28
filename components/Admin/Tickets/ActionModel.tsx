"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Ticket } from "@/types/ticket"

interface TicketModalProps {
  isOpen: boolean
  ticket: Ticket
  onClose: () => void
  onSave: (ticket: Ticket) => void
}

export function TicketModal({ isOpen, ticket, onClose, onSave }: TicketModalProps) {
  const [editedTicket, setEditedTicket] = useState<Ticket>({ ...ticket })
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Update editedTicket when ticket prop changes
  useEffect(() => {
    setEditedTicket({ ...ticket })
  }, [ticket])

  // Handle mounting for client-side rendering
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle focus management and keyboard events
  useEffect(() => {
    if (!isOpen) return

    // Save the currently focused element
    previousActiveElement.current = document.activeElement

    // Focus the modal when it opens
    if (modalRef.current) {
      modalRef.current.focus()
    }

    // Handle escape key press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    // Prevent body scrolling when modal is open
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)

      // Restore body scrolling when modal closes
      document.body.style.overflow = ""

      // Restore focus when modal closes
      if (previousActiveElement.current && "focus" in previousActiveElement.current) {
        ; (previousActiveElement.current as HTMLElement).focus()
      }
    }
  }, [isOpen, onClose])

  const handleStatusChange = () => {
    const statusMap: Record<string, string> = {
      open: "pending",
      pending: "closed",
      closed: "open",
    }

    setEditedTicket({
      ...editedTicket,
      status: statusMap[editedTicket.status],
    })
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    onSave(editedTicket)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-red-600"
      case "pending":
        return "text-yellow-600"
      case "closed":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  // Don't render anything on the server or if not open
  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/30 backdrop-blur-sm"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-[75vw] max-h-[90vh] overflow-auto animate-in fade-in zoom-in-95 duration-200"
        tabIndex={-1}
      >
        <div className="p-6">
          <div className="flex justify-start mb-6">
            <div
              id="modal-title"
              className="bg-blue-100 text-blue-600 px-8 py-1 rounded-md text-sm font-medium border border-blue-300"
            >
              #{editedTicket.id}
            </div>
          </div>

          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold">Type of Problem</h2>
            <p className="text-sm text-red-600 font-medium">Raised Date : {editedTicket.createdAt}</p>
          </div>

          <p className="my-6 text-gray-700 text-sm">{editedTicket.description}</p>

          <div className="space-y-3 mt-8 text-sm">
            <div className="flex">
              <span className="text-gray-500 w-32">Name :</span>
              <span className="font-medium">{editedTicket.customer.name}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-32">Phone No :</span>
              <span className="font-medium">{editedTicket.customer.phone}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-32">Email :</span>
              <span className="font-medium">{editedTicket.customer.email}</span>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
              onClick={handleStatusChange}
            >
              <span className={getStatusColor(editedTicket.status)}>
                {editedTicket.status.charAt(0).toUpperCase() + editedTicket.status.slice(1)}
              </span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-4 p-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md px-8"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-8">
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
