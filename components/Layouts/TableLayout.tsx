"use client"

import type React from "react"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, PlusCircle, ArrowUpDown, Download, Printer, Trash2, Eye, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Column definition interface
export interface ColumnDefinition<T> {
  key: keyof T
  header: string
  sortable?: boolean
  width?: string
  align?: "left" | "right" | "center"
  hidden?: boolean
  renderHeader?: (column: ColumnDefinition<T>) => React.ReactNode
  renderCell?: (value: any, item: T) => React.ReactNode
  sortingFn?: (a: T, b: T, direction: "asc" | "desc") => number
  filterOptions?: string[] | { value: string; label: string }[]
  filterFn?: (item: T, filterValue: string) => boolean
}

// Configuration interface for table
export interface TableConfiguration<T> {
  id: string
  data: T[]
  columns: ColumnDefinition<T>[]

  // Selection configuration
  selection?: {
    enabled?: boolean
    onSelectionChange?: (selectedItems: T[]) => void
    selectionKey?: keyof T
    disableSelection?: (item: T) => boolean
  }

  // Search configuration
  search?: {
    enabled?: boolean
    keys?: (keyof T)[]
    placeholder?: string
    onSearch?: (searchTerm: string) => void
  }

  // Filtering configuration
  filters?: {
    enabled?: boolean
    defaultFilter?: string
    onFilterChange?: (filter: string) => void
  }

  // Pagination configuration
  pagination?: {
    enabled?: boolean
    pageSizeOptions?: number[]
    defaultPageSize?: number
    onPageChange?: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    serverSide?: boolean
    totalItems?: number
  }

  // Sorting configuration
  sorting?: {
    enabled?: boolean
    defaultSortColumn?: keyof T
    defaultSortDirection?: "asc" | "desc"
    onSortChange?: (column: keyof T, direction: "asc" | "desc") => void
    serverSide?: boolean
  }

  // Actions configuration
  actions?: {
    onAdd?: () => void
    addButtonText?: string
    bulkActions?: {
      delete?: (items: T[]) => void
      export?: (items: T[]) => void
      print?: (items: T[]) => void
      edit?: (items: T[]) => void
      view?: (item: T) => void
      custom?: { label: string; action: (items: T[]) => void }[]
    }
    rowActions?: {
      view?: (item: T) => void
      edit?: (item: T) => void
      delete?: (item: T) => void
      custom?: { label: string; action: (item: T) => void; icon?: React.ReactNode }[]
    }
  }

  // Customization
  customization?: {
    // Custom status color mapping
    statusColorMap?: Record<string, string>

    // Custom cell rendering for specific columns
    cellRenderers?: {
      [key: string]: (value: any, item: T) => React.ReactNode
    }

    // Custom CSS classes
    tableClassName?: string
    headerClassName?: string
    rowClassName?: string | ((item: T) => string)
    cellClassName?: string | ((column: keyof T, item: T) => string)

    // Empty state
    emptyState?: React.ReactNode

    // Loading state
    loadingState?: React.ReactNode
    isLoading?: boolean

    // Virtualization for large datasets
    virtualized?: boolean

    // Row hover effect
    rowHoverEffect?: boolean

    // Zebra striping
    zebraStriping?: boolean

    // Sticky header
    stickyHeader?: boolean

    // Responsive behavior
    responsiveMode?: "scroll" | "stack" | "collapse"
  }

  // Event handlers
  onRowClick?: (item: T) => void
}

// Add this to your global CSS or as a utility class
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

export function EnhancedTable<T extends Record<string, any>>({
  id,
  data,
  columns,
  selection = { enabled: false },
  search = { enabled: true },
  filters = { enabled: false },
  pagination = { enabled: true },
  sorting = { enabled: true },
  actions,
  customization = {},
  onRowClick,
}: TableConfiguration<T>) {
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<string>(filters.defaultFilter || "All")
  const [pageSize, setPageSize] = useState(pagination.defaultPageSize || 10)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: "asc" | "desc"
  }>({
    key: sorting.defaultSortColumn || null,
    direction: sorting.defaultSortDirection || "asc",
  })

  // Refs for positioning dropdowns
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)

  // Default search keys (all keys if not specified)
  const searchKeys = search.keys || (data.length > 0 ? (Object.keys(data[0]) as (keyof T)[]) : [])

  // Selection key for identifying unique rows
  const selectionKey =
    selection.selectionKey || (data.length > 0 ? (Object.keys(data[0])[0] as keyof T) : ("id" as keyof T))

  // Reset selection when data changes
  useEffect(() => {
    setSelectedItems([])
  }, [data])

  // Notify parent component of selection changes
  useEffect(() => {
    selection.onSelectionChange?.(selectedItems)
  }, [selectedItems, selection])

  // Add scrollbar-hide styles to document
  useEffect(() => {
    // Create style element if it doesn't exist
    const styleId = "scrollbar-hide-styles"
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = scrollbarHideStyles
      document.head.appendChild(style)
    }

    return () => {
      // Optional cleanup
    }
  }, [])

  // Filtering data
  const filteredData = useMemo(() => {
    if (data.length === 0) return []

    let filtered = [...data]

    // Apply search filter
    if (searchTerm && search.enabled) {
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key]
          return value ? String(value).toLowerCase().includes(searchTerm.toLowerCase()) : false
        }),
      )
    }

    // Apply category filter if not "All"
    if (filters.enabled && activeFilter !== "All") {
      filtered = filtered.filter((item) => {
        // Find the column that has filterOptions
        const filterColumn = columns.find((col) => col.filterOptions)
        if (!filterColumn) return true

        // Use custom filter function if provided
        if (filterColumn.filterFn) {
          return filterColumn.filterFn(item, activeFilter)
        }

        // Default filtering behavior
        return String(item[filterColumn.key]) === activeFilter
      })
    }

    return filtered
  }, [data, searchTerm, activeFilter, searchKeys, columns, search.enabled, filters.enabled])

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sorting.enabled || !sortConfig.key || filteredData.length === 0) return filteredData

    const sortableData = [...filteredData]
    const column = columns.find((col) => col.key === sortConfig.key)

    sortableData.sort((a, b) => {
      // Use custom sorting function if provided
      if (column?.sortingFn) {
        return column.sortingFn(a, b, sortConfig.direction)
      }

      // Default sorting behavior
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1
      if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })

    return sortableData
  }, [filteredData, sortConfig, columns, sorting.enabled])

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination.enabled || sortedData.length === 0) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination.enabled])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))

  // Selection handlers
  const isItemSelected = useCallback(
    (item: T) => {
      if (!item || !selectionKey) return false
      return selectedItems.some((selectedItem) => selectedItem[selectionKey] === item[selectionKey])
    },
    [selectedItems, selectionKey],
  )

  const toggleItemSelection = useCallback(
    (item: T, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation()
      }

      setSelectedItems((prev) => {
        const isSelected = isItemSelected(item)

        if (isSelected) {
          return prev.filter((i) => i[selectionKey] !== item[selectionKey])
        } else {
          return [...prev, item]
        }
      })
    },
    [isItemSelected, selectionKey],
  )

  const toggleAllSelection = useCallback(() => {
    if (selectedItems.length === paginatedData.length) {
      setSelectedItems([])
    } else {
      const selectableItems = paginatedData.filter((item) => !selection.disableSelection?.(item))
      setSelectedItems(selectableItems)
    }
  }, [paginatedData, selectedItems.length, selection])

  // Sorting handler
  const handleSort = useCallback(
    (key: keyof T) => {
      if (!sorting.enabled) return

      let direction: "asc" | "desc" = "asc"
      if (sortConfig.key === key) {
        direction = sortConfig.direction === "asc" ? "desc" : "asc"
      }

      setSortConfig({ key, direction })

      // Call the onSortChange callback if provided
      if (sorting.onSortChange) {
        sorting.onSortChange(key, direction)
      }
    },
    [sortConfig, sorting],
  )

  // Pagination handlers
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page)
      pagination.onPageChange?.(page)
    },
    [pagination],
  )

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size)
      setCurrentPage(1)
      pagination.onPageSizeChange?.(size)
    },
    [pagination],
  )

  // Filter handler
  const handleFilterChange = useCallback(
    (filter: string) => {
      setActiveFilter(filter)
      setCurrentPage(1)
      filters.onFilterChange?.(filter)
    },
    [filters],
  )

  // Search handler
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term)
      setCurrentPage(1)
      search.onSearch?.(term)
    },
    [search],
  )

  // Page number generation
  const getPageNumbers = useCallback(() => {
    const pageNumbers = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return pageNumbers
  }, [currentPage, totalPages])

  // Render cell with custom or default rendering
  const renderCell = useCallback(
    (column: ColumnDefinition<T>, item: T) => {
      const value = item[column.key]

      // Use column's renderCell if provided
      if (column.renderCell) {
        return column.renderCell(value, item)
      }

      // Use customization.cellRenderers if provided
      if (customization.cellRenderers && customization.cellRenderers[String(column.key)]) {
        return customization.cellRenderers[String(column.key)](value, item)
      }

      // Special handling for different data types
      if (column.key === "status" && typeof value === "string") {
        const statusColorMap = customization.statusColorMap || {
          active: "bg-green-100 text-green-800 border-green-200 font-extralight",
          inactive: "bg-red-100 text-red-800 border-red-200",
          pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
          default: "bg-gray-100 text-gray-800 border-gray-200",
        }

        return (
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-1 rounded-full text-xs font-extralight uppercase border",
              statusColorMap[value.toLowerCase()] || statusColorMap["default"],
            )}
          >
            {value}
          </Badge>
        )
      }

      // Handle image/thumbnail columns
      if (
        typeof value === "string" &&
        (column.key === "image" ||
          column.key === "thumbnail" ||
          column.key === "avatar" ||
          String(column.key).includes("image") ||
          String(column.key).includes("thumbnail") ||
          String(column.key).includes("photo"))
      ) {
        return (
          <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-gray-100">
            <Image
              src={value || "/placeholder.svg?height=64&width=64&query=product"}
              alt={String(item.name || item.title || "Thumbnail")}
              fill
              className="object-cover"
            />
          </div>
        )
      }

      // Handle price columns
      if (
        (typeof value === "number" || typeof value === "string") &&
        (String(column.key).includes("price") ||
          String(column.key).includes("cost") ||
          String(column.key).includes("amount"))
      ) {
        // Check if the value is a number or can be parsed as a number
        const numValue = typeof value === "number" ? value : Number.parseFloat(value)

        if (!isNaN(numValue)) {
          // Format as currency if it's a valid number
          return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(numValue)
        }
      }

      // Default rendering
      return value !== undefined && value !== null ? 
      <div className="truncate max-w-32 text-left">
        {String(value)}
      </div> 
      : 
      ""
    },
    [customization.cellRenderers, customization.statusColorMap],
  )


  // Get row class name
  const getRowClassName = useCallback(
    (item: T) => {
      if (typeof customization.rowClassName === "function") {
        return customization.rowClassName(item)
      }
      return customization.rowClassName || ""
    },
    [customization.rowClassName],
  )

  // Get cell class name
  const getCellClassName = useCallback(
    (column: keyof T, item: T) => {
      if (typeof customization.cellClassName === "function") {
        return customization.cellClassName(column, item)
      }
      return customization.cellClassName || ""
    },
    [customization.cellClassName],
  )

  // Render header with custom or default rendering
  const renderHeader = useCallback(
    (column: ColumnDefinition<T>) => {
      if (column.renderHeader) {
        return column.renderHeader(column)
      }

      return (
        <div className="flex items-center space-x-1">
          <span>{column.header}</span>
          {/* {column.sortable && sorting.enabled && (
            <ArrowUpDown
              className={cn("ml-1 h-4 w-4", sortConfig.key === column.key ? "text-primary" : "text-primary/70")}
            />
          )} */}
        </div>
      )
    },
    [sortConfig.key, sorting.enabled],
  )

  // Handle row click while preventing checkbox click propagation
  const handleRowClick = useCallback(
    (item: T, event: React.MouseEvent) => {
      // Check if the click was on a checkbox or its container
      const target = event.target as HTMLElement
      if (target.closest('input[type="checkbox"]')) {
        return // Don't trigger row click if checkbox was clicked
      }

      if (onRowClick) {
        onRowClick(item)
      }
    },
    [onRowClick],
  )

  // Render loading state
  if (customization.isLoading) {
    return (
      customization.loadingState || (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )
    )
  }

  return (
    <div id={id} className="w-full">
      {/* Top Controls: Search, Filter, Add, and Bulk Actions */}
      <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          {/* Search and Add Button */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            {/* Search */}
            {search.enabled && (
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={search.placeholder || "Search..."}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            )}

            {/* Add Button - Moved next to search bar */}
            {actions?.onAdd && (
              <Button className="flex items-center space-x-2 whitespace-nowrap text-white" onClick={actions.onAdd}>
                <PlusCircle className="h-4 w-4" />
                <span>{actions.addButtonText || "Add New"}</span>
              </Button>
            )}
          </div>

          {/* Filter components removed as requested */}
        </div>

        {/* Bulk Actions - Only show when items are selected */}
        <div className="flex items-center space-x-2">
          {selection.enabled && selectedItems.length > 0 && actions?.bulkActions && (
            <div className="flex space-x-2">
              {actions.bulkActions.view && selectedItems.length === 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.bulkActions?.view?.(selectedItems[0])}
                  className="flex items-center space-x-1"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                  {/* <span>View</span> */}
                </Button>
              )}
              {actions.bulkActions.edit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.bulkActions?.edit?.(selectedItems)}
                  className="flex items-center space-x-1 text-primary hover:bg-primary hover:text-white cursor-pointer"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                  {/* <span>Edit</span> */}
                </Button>
              )}
              {actions.bulkActions.delete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 text-destructive hover:bg-destructive/10 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer"
                  onClick={() => actions.bulkActions?.delete?.(selectedItems)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                  {/* <span>Delete</span> */}
                </Button>
              )}
              {actions.bulkActions.export && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 text-primary hover:bg-primary hover:text-white cursor-pointer"
                  onClick={() => actions.bulkActions?.export?.(selectedItems)}
                  title="Export"
                >
                  <Download className="h-4 w-4" />
                  {/* <span>Export</span> */}
                </Button>
              )}
              {actions.bulkActions.print && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                  onClick={() => actions.bulkActions?.print?.(selectedItems)}
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                  {/* <span>Print</span> */}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs removed as requested */}

      {/* Table Section - Made horizontally scrollable outside */}
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <div ref={tableContainerRef} className="scrollbar-hide overflow-x-auto">
          <Table>
            <TableHeader
              className={cn(
                "bg-blue-200 text-primary",
                customization.headerClassName,
                customization.stickyHeader && "sticky top-0 z-10",
              )}
            >
              <TableRow className="border-gray-200">
                {/* Selection Checkbox */}
                {selection.enabled && (
                  <TableHead className="w-[40px] px-2">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={paginatedData.length > 0 && selectedItems.length === paginatedData.length}
                        onChange={toggleAllSelection}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        aria-label="Select all"
                      />
                    </div>
                  </TableHead>
                )}

                {/* Column Headers */}
                {columns
                  .filter((column) => !column.hidden)
                  .map((column) => (
                    <TableHead
                      key={String(column.key)}
                      onClick={() => column.sortable && handleSort(column.key)}
                      className={cn(
                        column.sortable && sorting.enabled ? "cursor-pointer hover:bg-primary/10" : "",
                        column.align === "right" && "text-right",
                        column.align === "left" && "text-left",
                        column.align === "center" && "text-center",
                        column.width ? `w-[${column.width}]` : "",
                        "whitespace-nowrap",
                      )}
                    >
                      {renderHeader(column)}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const isSelected = isItemSelected(item)
                  const isDisabled = selection.disableSelection?.(item)

                  return (
                    <TableRow
                      key={String(item[selectionKey]) || index}
                      className={cn(
                        "border-gray-200",
                        onRowClick && "cursor-pointer hover:bg-muted/50",
                        isSelected && "bg-primary/5",
                        customization.zebraStriping && index % 2 === 1 && "bg-muted/50",
                        customization.rowHoverEffect && "hover:bg-muted/50",
                        getRowClassName(item),
                      )}
                      onClick={(e) => handleRowClick(item, e)}
                    >
                      {/* Selection Checkbox */}
                      {selection.enabled && (
                        <TableCell className="w-[40px] px-2">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection(item)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isDisabled}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </div>
                        </TableCell>
                      )}

                      {/* Data Cells */}
                      {columns
                        .filter((column) => !column.hidden)
                        .map((column) => (
                          <TableCell
                            key={String(column.key)}
                            className={cn(
                              column.align === "left" && "text-left",
                              column.align === "right" && "text-right",
                              column.align === "center" && "text-center",
                              getCellClassName(column.key, item),
                            )}
                          >
                            {renderCell(column, item)}
                          </TableCell>
                        ))}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {paginatedData.length === 0 &&
          filteredData.length === 0 &&
          (customization.emptyState || (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="mb-2 text-lg font-medium">No records found</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "There are no items to display."}
              </p>
            </div>
          ))}
      </div>

      {/* Pagination Section */}
      {pagination.enabled && totalPages > 0 && (
        <div ref={paginationRef} className="mt-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Showing</span>
            <strong>
              {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}
              {" - "}
              {Math.min(currentPage * pageSize, filteredData.length)}
            </strong>
            <span>of</span>
            <strong>{filteredData.length}</strong>
            <span>items</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(1)}>
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>

            <div className="flex items-center">
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="mx-0.5 h-8 w-8 p-0"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
            >
              Last
            </Button>
          </div>

          {/* Items per page - Simplified */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <div className="flex space-x-1">
              {(pagination.pageSizeOptions || [10, 25, 50, 100]).map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={cn(
                    "px-2 py-1 text-xs rounded",
                    pageSize === size ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedTable
