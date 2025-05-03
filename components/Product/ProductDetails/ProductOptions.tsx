"use client"

import { cn } from "@/lib/utils"

interface ColorOption {
  name: string
  value: string
}

interface StorageOption {
  value: string
  label: string
}

interface ProductOptionsProps {
  colors?: ColorOption[]
  selectedColor: string
  onColorChange: (color: string) => void
  storageOptions?: StorageOption[]
  selectedStorage: string
  onStorageChange: (storage: string) => void
  className?: string
}

export default function ProductOptions({
  colors,
  selectedColor,
  onColorChange,
  storageOptions,
  selectedStorage,
  onStorageChange,
  className,
}: ProductOptionsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* RAM / Storage Options */}
      {storageOptions && storageOptions.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-3">RAM / Internal Storage</h3>
          <div className="flex gap-3">
            {storageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onStorageChange(option.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm border",
                  selectedStorage === option.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300 hover:border-gray-400",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Options */}
      {colors && colors.length > 0 && (
        <div className="mt-6">
          <h3 className="text-base font-medium mb-3">Color</h3>
          <div className="mb-2">
            <span className="text-gray-700">{colors.find((c) => c.value === selectedColor)?.name || "Default"}</span>
          </div>
          <div className="flex gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorChange(color.value)}
                className={cn(
                  "w-10 h-10 rounded-full border",
                  selectedColor === color.value ? "ring-2 ring-black ring-offset-1" : "border-gray-300",
                )}
                style={{ backgroundColor: color.value }}
                aria-label={`Select ${color.name} color`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
