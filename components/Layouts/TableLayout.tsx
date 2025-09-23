"use client"

import type React from "react"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Download, Printer, Trash2, Eye, Edit } from "lucide-react"
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
  selection?: {
    enabled?: boolean
    onSelectionChange?: (selectedItems: T[]) => void
    selectionKey?: keyof T
    disableSelection?: (item: T) => boolean
  }
  search?: {
    enabled?: boolean
    keys?: (keyof T)[]
    placeholder?: string
    onSearch?: (searchTerm: string) => void
  }
  filters?: {
    enabled?: boolean;
    defaultFilter?: string;
    onFilterChange?: (filter: string) => void;
    customFilters?: Array<{
      key: string;
      label: string;
      type: string;
      defaultValue: boolean;
    }>;
  };
  pagination?: {
    enabled?: boolean
    pageSizeOptions?: number[]
    defaultPageSize?: number
    onPageChange?: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    serverSide?: boolean
    totalItems?: number
  }
  sorting?: {
    enabled?: boolean
    defaultSortColumn?: keyof T
    defaultSortDirection?: "asc" | "desc"
    onSortChange?: (column: keyof T, direction: "asc" | "desc") => void
    serverSide?: boolean
  }
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
  customization?: {
    statusColorMap?: Record<string, string>
    cellRenderers?: { [key: string]: (value: any, item: T) => React.ReactNode }
    tableClassName?: string
    headerClassName?: string
    rowClassName?: string | ((item: T) => string)
    cellClassName?: string | ((column: keyof T, item: T) => string)
    emptyState?: React.ReactNode
    loadingState?: React.ReactNode
    isLoading?: boolean
    virtualized?: boolean
    rowHoverEffect?: boolean
    zebraStriping?: boolean
    stickyHeader?: boolean
    responsiveMode?: "scroll" | "stack" | "collapse"
  }
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

  // Default search keys
  const searchKeys = search.keys || (data.length > 0 ? (Object.keys(data[0]) as (keyof T)[]) : [])

  // Selection key
  const selectionKey =
    selection.selectionKey || (data.length > 0 ? (Object.keys(data[0])[0] as keyof T) : ("id" as keyof T))

  // Reset selection when data changes
  useEffect(() => {
    setSelectedItems([])
  }, [data])

  // Notify parent of selection changes
  useEffect(() => {
    selection.onSelectionChange?.(selectedItems)
  }, [selectedItems, selection])

  // Add scrollbar-hide styles
  useEffect(() => {
    const styleId = "scrollbar-hide-styles"
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = scrollbarHideStyles
      document.head.appendChild(style)
    }
    return () => { }
  }, [])

  // Filtering data
  const filteredData = useMemo(() => {
    if (data.length === 0) return []

    let filtered = [...data]
    if (searchTerm && search.enabled) {
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key]
          return value ? String(value).toLowerCase().includes(searchTerm.toLowerCase()) : false
        }),
      )
    }
    if (filters.enabled && activeFilter !== "All") {
      const filterColumn = columns.find((col) => col.filterOptions)
      if (filterColumn) {
        filtered = filtered.filter((item) => {
          if (filterColumn.filterFn) {
            return filterColumn.filterFn(item, activeFilter)
          }
          return String(item[filterColumn.key]) === activeFilter
        })
      }
    }
    return filtered
  }, [data, searchTerm, activeFilter, searchKeys, columns, search.enabled, filters.enabled])

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sorting.enabled || !sortConfig.key || filteredData.length === 0) return filteredData

    const sortableData = [...filteredData]
    const column = columns.find((col) => col.key === sortConfig.key)
    sortableData.sort((a, b) => {
      if (column?.sortingFn) {
        return column.sortingFn(a, b, sortConfig.direction)
      }
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]
      if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1
      if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1
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
      if (event) event.stopPropagation()
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
      sorting.onSortChange?.(key, direction)
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

  // Export selected data
  const exportSelectedData = useCallback((items: T[]) => {
    if (items.length === 0) return;
    const headers = columns
      .filter(col => !col.hidden)
      .map(col => col.header);
    const dataRows = items.map(item =>
      columns
        .filter(col => !col.hidden)
        .map(col => {
          const value = item[col.key];
          return value !== undefined && value !== null ? String(value) : "";
        })
    );
    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [columns]);

  // Page numbers
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

  // Render cell
  const renderCell = useCallback(
    (column: ColumnDefinition<T>, item: T) => {
      const value = item[column.key]
      if (column.renderCell) {
        return column.renderCell(value, item)
      }
      if (customization.cellRenderers && customization.cellRenderers[String(column.key)]) {
        return customization.cellRenderers[String(column.key)](value, item)
      }
      if (column.key === "status" && typeof value === "string") {
        const statusColorMap = customization.statusColorMap || {
          active: "bg-green-100 text-green-800 border-green-300 font-medium",
          inactive: "bg-red-100 text-red-800 border-red-300 font-medium",
          pending: "bg-yellow-100 text-yellow-800 border-yellow-300 font-medium",
          default: "bg-gray-100 text-gray-800 border-gray-300 font-medium",
        }
        return (
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium uppercase border",
              statusColorMap[value.toLowerCase()] || statusColorMap["default"],
            )}
          >
            {value}
          </Badge>
        )
      }
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
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 ">
            <img
              src={value || "/placeholder.svg?height=48&width=48&query=product"}
              alt={String(item.name || item.title || "Thumbnail")}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )
      }
      if (
        (typeof value === "number" || typeof value === "string") &&
        (String(column.key).includes("price") ||
          String(column.key).includes("cost") ||
          String(column.key).includes("amount"))
      ) {
        const numValue = typeof value === "number" ? value : Number.parseFloat(value)
        if (!isNaN(numValue)) {
          return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(numValue)
        }
      }
      return value !== undefined && value !== null ?
        <div className="truncate max-w-[150px] text-sm">
          {String(value)}
        </div>
        : ""
    },
    [customization.cellRenderers, customization.statusColorMap],
  )

  // Row class name
  const getRowClassName = useCallback(
    (item: T) => {
      if (typeof customization.rowClassName === "function") {
        return customization.rowClassName(item)
      }
      return customization.rowClassName || ""
    },
    [customization.rowClassName],
  )

  // Cell class name
  const getCellClassName = useCallback(
    (column: keyof T, item: T) => {
      if (typeof customization.cellClassName === "function") {
        return customization.cellClassName(column, item)
      }
      return customization.cellClassName || ""
    },
    [customization.cellClassName],
  )

  // Render header
  const renderHeader = useCallback(
    (column: ColumnDefinition<T>) => {
      if (column.renderHeader) {
        return column.renderHeader(column)
      }
      return (
        <div className="flex items-center space-x-2 font-semibold text-gray-700">
          <span className="uppercase text-xs tracking-wide">{column.header}</span>
          {column.sortable && sorting.enabled && (
            <ArrowUpDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                sortConfig.key === column.key ? "text-blue-600" : "text-gray-400",
                sortConfig.key === column.key && sortConfig.direction === "desc" && "rotate-180",
              )}
            />
          )}
        </div>
      )
    },
    [sortConfig.key, sortConfig.direction, sorting.enabled],
  )

  // Handle row click
  const handleRowClick = useCallback(
    (item: T, event: React.MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input[type="checkbox"]')) return
      if (onRowClick) onRowClick(item)
    },
    [onRowClick],
  )

  // Loading state
  if (customization.isLoading) {
    return (
      customization.loadingState || (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl ">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )
    )
  }

  return (
    <div id={id} className="w-full space-y-6  rounded-2xl ">
      {/* Top Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 w-full">
          {/* Search and Add Button */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {search.enabled && (
              <div className="relative flex-1 md:w-80">
                <svg
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder={search.placeholder || "Search entries..."}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white  transition-all duration-300 placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            )}
            {actions?.onAdd && (
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] text-white rounded-xl hover:to-primary-hover transition-all duration-300  text-sm font-medium"
                onClick={actions.onAdd}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>{actions.addButtonText || "Add New"}</span>
              </button>
            )}
          </div>
        </div>
        {/* Bulk Actions */}
        {selection.enabled && selectedItems.length > 0 && actions?.bulkActions && (
          <div className="flex  gap-3">
            {actions.bulkActions.view && selectedItems.length === 1 && (
              <button
                onClick={() => actions.bulkActions?.view?.(selectedItems[0])}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-primary hover:text-white  transition-all duration-300"
                title="View"
              >
                <Eye className="h-5 w-5 text-gray-600 group-hover:text-white transition-transform duration-300 group-hover:scale-110" />
                <span className="text-sm font-medium">View</span>
              </button>
            )}
            {actions.bulkActions.edit && (
              <button
                onClick={() => actions.bulkActions?.edit?.(selectedItems)}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                title="Edit"
              >
                <Edit className="h-5 w-5 text-primary group-hover:text-white transition-transform duration-300 group-hover:rotate-12" />
                <span className="text-sm font-medium">Edit</span>
              </button>
            )}
            {actions.bulkActions.delete && (
              <button
                onClick={() => actions.bulkActions?.delete?.(selectedItems)}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white  transition-all duration-300"
                title="Delete"
              >
                <Trash2 className="h-5 w-5 text-red-600 group-hover:text-white transition-transform duration-300 group-hover:scale-110" />
                <span className="text-sm font-medium">Delete</span>
              </button>
            )}
            {actions.bulkActions.export && (
              <button
                onClick={() => exportSelectedData(selectedItems)}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white  transition-all duration-300"
                title="Export"
              >
                <Download className="h-5 w-5 text-green-600 group-hover:text-white transition-transform duration-300 group-hover:-translate-y-0.5" />
                <span className="text-sm font-medium">Export</span>
              </button>
            )}
            {actions.bulkActions.print && (
              <button
                onClick={() => actions.bulkActions?.print?.(selectedItems)}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white  transition-all duration-300"
                title="Print"
              >
                <Printer className="h-5 w-5 text-teal-600 group-hover:text-white transition-transform duration-300 group-hover:scale-105" />
                <span className="text-sm font-medium">Print</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      {filters.enabled && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Filter:</span>
          <div className="flex gap-2 rounded-xl bg-white p-2 ">
            <button
              key="all"
              onClick={() => handleFilterChange("All")}
              className={cn(
                "px-4 py-2 text-sm rounded-lg font-medium transition-all duration-300",
                activeFilter === "All"
                  ? "bg-primary text-white "
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              All
            </button>
            {columns.find(col => col.filterOptions)?.filterOptions?.map((option) => {
              const value = typeof option === 'string' ? option : option.value;
              const label = typeof option === 'string' ? option : option.label;
              return (
                <button
                  key={value}
                  onClick={() => handleFilterChange(value)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-lg font-medium transition-all duration-300",
                    activeFilter === value
                      ? "bg-blue-600 text-white "
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white  overflow-hidden">
        <div ref={tableContainerRef} className="scrollbar-hide overflow-x-auto">
          <Table className={cn("w-full", customization.tableClassName)}>
            <TableHeader
              className={cn(
                "bg-gray-50 text-gray-700",
                customization.headerClassName,
                customization.stickyHeader && "sticky top-0 z-10",
              )}
            >
              <TableRow className="border-b border-gray-200">
                {selection.enabled && (
                  <TableHead className="w-12 px-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={paginatedData.length > 0 && selectedItems.length === paginatedData.length}
                        onChange={toggleAllSelection}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        aria-label="Select all"
                      />
                    </div>
                  </TableHead>
                )}
                {columns
                  .filter((column) => !column.hidden)
                  .map((column) => (
                    <TableHead
                      key={String(column.key)}
                      onClick={() => column.sortable && handleSort(column.key)}
                      className={cn(
                        "py-4 px-6",
                        column.sortable && sorting.enabled ? "cursor-pointer hover:bg-primary-light transition-colors duration-200" : "",
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
                        "border-b border-gray-200 transition-colors duration-200",
                        onRowClick && "cursor-pointer",
                        isSelected && "bg-primary-light",
                        customization.zebraStriping && index % 2 === 1 && "bg-gray-50",
                        customization.rowHoverEffect && "hover:bg-primary-light/50",
                        getRowClassName(item),
                      )}
                      onClick={(e) => handleRowClick(item, e)}
                    >
                      {selection.enabled && (
                        <TableCell className="w-12 px-4">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection(item)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isDisabled}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                          </div>
                        </TableCell>
                      )}
                      {columns
                        .filter((column) => !column.hidden)
                        .map((column) => (
                          <TableCell
                            key={String(column.key)}
                            className={cn(
                              "py-3 px-6 text-sm text-gray-700",
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
                null
              )}
            </TableBody>
          </Table>
        </div>
        {paginatedData.length === 0 && filteredData.length === 0 && (
          customization.emptyState || (
            <div className="flex flex-col items-center justify-center py-12 bg-white">
              <svg
                className="h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-700">No records found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "There are no items to display."}
              </p>
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      {pagination.enabled && totalPages > 0 && (
        <div
          ref={paginationRef}
          className="flex flex-col items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-200  md:flex-row"
        >
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <span>Showing</span>
            <span className="px-3 py-1 bg-primary-light text-primary rounded-full">
              {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} -{" "}
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>
            <span>of {filteredData.length} items</span>
          </div>
          <div className="flex items-center gap-2">
            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "w-10 h-10 rounded-full transition-all duration-300",
                  currentPage === page
                    ? "bg-primary text-white  hover:bg-primary-hover"
                    : "text-gray-600 hover:bg-primary-light"
                )}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Items per page</span>
            <div className="flex gap-2 bg-white p-1 rounded-xl ">
              {(pagination.pageSizeOptions || [10, 25, 50, 100]).map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-lg font-medium transition-all duration-300",
                    pageSize === size
                      ? "bg-primary text-white "
                      : "text-gray-600 hover:bg-primary-light"
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