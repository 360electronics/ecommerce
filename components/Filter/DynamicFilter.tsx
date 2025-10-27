'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Range } from 'react-range';
import { motion, AnimatePresence } from 'framer-motion';
import { FlattenedProduct } from '@/types/product';

interface FilterSection {
  id: string;
  title: string;
  type: 'checkbox' | 'range' | 'radio';
  options?: { id: string; label: string; checked: boolean }[];
  min?: number;
  max?: number;
  currentMin?: number;
  currentMax?: number;
  step?: number;
}

interface FilterOptions {
  colors: string[];
  brands: string[];
  storageOptions: string[];
  priceRange: { min: number; max: number };
  attributes: { [key: string]: string[] };
}

interface FilterProps {
  category?: string;
  products: FlattenedProduct[];
  onFilterChange: (filters: FilterValues) => void;
  filterOptions: FilterOptions;
}

interface FilterValues {
  [key: string]: string[] | boolean | { min: number; max: number };
}

const filterConfig = [
  { id: 'price', title: 'Price', type: 'range', step: 10, enabled: true },
  { id: 'category', title: 'Categories', type: 'checkbox', enabled: true },
  { id: 'rating', title: 'Rating', type: 'checkbox', enabled: true },
  { id: 'color', title: 'Color', type: 'checkbox', enabled: true },
  { id: 'storage', title: 'Storage', type: 'checkbox', enabled: true },
  { id: 'brand', title: 'Brands', type: 'checkbox', enabled: true },
] as const;

const DynamicFilter: React.FC<FilterProps> = ({ category, products, onFilterChange, filterOptions }) => {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [filterSections, setFilterSections] = useState<FilterSection[]>([]);
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState<{ [key: string]: number }>({});
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);

  const roundMaxPrice = (max: number): number => {
    if (max <= 0) return 1000;
    if (max <= 1000) return Math.ceil(max / 100) * 100;
    return Math.ceil(max / 1000) * 1000;
  };

  const generateOptions = (products: FlattenedProduct[], key: keyof FlattenedProduct | string) => {
    const uniqueValues = new Set<string>();
    products.forEach((product) => {
      let value: any;
      if (key in product && key !== 'attributes') {
        value = product[key as keyof FlattenedProduct];
      } else if (product.attributes && key in product.attributes) {
        value = product.attributes[key];
      }
      if (typeof value === 'string' && value.trim()) {
        uniqueValues.add(value);
      } else if (Array.isArray(value)) {
        value.forEach((v: string) => v.trim() && uniqueValues.add(v));
      }
    });
    return Array.from(uniqueValues)
      .sort()
      .map((value) => ({ id: value, label: value, checked: false }));
  };

  const generateRatingOptions = (products: FlattenedProduct[]) => {
    const ratings = products
      .map((product) => Math.floor(Number(product.averageRating) || 0))
      .filter((rating) => rating >= 1 && rating <= 5);
    const uniqueRatings = Array.from(new Set(ratings)).sort((a, b) => b - a);
    return uniqueRatings.map((rating) => ({
      id: rating.toString(),
      label: `${rating} Star${rating > 1 ? 's' : ''} & Up`,
      checked: false,
    }));
  };

  const generatedSections = useMemo(() => {
    if (products.length === 0) return [];

    const sections: FilterSection[] = [];
    const optionsMap: { [key: string]: { id: string; label: string; checked: boolean }[] } = {
      color: filterOptions.colors.map((value) => ({ id: value, label: value, checked: false })),
      brand: filterOptions.brands.map((value) => ({ id: value, label: value, checked: false })),
      storage: filterOptions.storageOptions.map((value) => ({ id: value, label: value, checked: false })),
      category: category ? [] : generateOptions(products, 'category'),
      rating: generateRatingOptions(products),
    };

    filterConfig.forEach((config) => {
      if (!config.enabled) return;
      if (config.type === 'range' && config.id === 'price') {
        const maxPrice = roundMaxPrice(filterOptions.priceRange.max || 1000);
        sections.push({
          id: 'price',
          title: config.title,
          type: 'range',
          min: 0,
          max: maxPrice,
          currentMin: 0,
          currentMax: maxPrice,
          step: config.step,
        });
      } else if (config.type === 'checkbox' && optionsMap[config.id]?.length > 0) {
        sections.push({
          id: config.id,
          title: config.title,
          type: 'checkbox',
          options: optionsMap[config.id],
        });
      }
    });

    Object.keys(filterOptions.attributes).forEach((attrKey) => {
      if (filterConfig.some((config) => config.id === attrKey)) return;
      const values = filterOptions.attributes[attrKey];
      if (values.length > 0) {
        sections.push({
          id: attrKey,
          title: attrKey.charAt(0).toUpperCase() + attrKey.slice(1).replace(/([A-Z])/g, ' $1'),
          type: 'checkbox',
          options: values.map((value) => ({ id: value, label: value, checked: false })),
        });
      }
    });

    return sections;
  }, [products, category, filterOptions]);

  useEffect(() => {
    if (generatedSections.length === 0 || isInitialized.current) return;

    setExpanded((prev) => {
      const newExpanded = { ...prev };
      generatedSections.forEach((section, index) => {
        if (!(section.id in newExpanded)) {
          newExpanded[section.id] = index < 4;
        }
      });
      return newExpanded;
    });

    setVisibleOptions((prev) => {
      const newVisible = { ...prev };
      generatedSections.forEach((section) => {
        if (!(section.id in newVisible)) {
          newVisible[section.id] = 5;
        }
      });
      return newVisible;
    });

    setFilterSections(generatedSections);
    isInitialized.current = true;
  }, [generatedSections]);

  useEffect(() => {
    if (filterSections.length === 0 || !isInitialized.current) return;

    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const excludeOOS = searchParams.get('inStock') === 'true';

    const hasUrlParams = minPrice || maxPrice || excludeOOS || 
      filterConfig.some(config => config.type === 'checkbox' && searchParams.getAll(config.id).length > 0) ||
      Object.keys(filterOptions.attributes).some(key => searchParams.getAll(key).length > 0);

    if (!hasUrlParams) return;

    const updatedSections = filterSections.map((section) => {
      if (section.type === 'range' && section.id === 'price') {
        if (minPrice || maxPrice) {
          const newMin = minPrice ? Math.max(Number(minPrice), 0) : 0;
          const newMax = maxPrice ? Math.min(Number(maxPrice), section.max || 1000) : section.max || 1000;
          if (!isNaN(newMin) && !isNaN(newMax)) {
            return { ...section, currentMin: newMin, currentMax: newMax };
          }
        }
      } else if (section.type === 'checkbox' && section.options) {
        const paramValues = searchParams.getAll(section.id);
        if (paramValues.length > 0) {
          return {
            ...section,
            options: section.options.map((option) => ({
              ...option,
              checked: paramValues.includes(option.id),
            })),
          };
        }
      }
      return section;
    });

    setFilterSections(updatedSections);
    setExcludeOutOfStock(excludeOOS);
    const filters = getFilterValues(updatedSections, excludeOOS);
    onFilterChange(filters);
  }, []);

  const getFilterValues = (sections: FilterSection[], excludeOOS: boolean) => {
    const filters: FilterValues = {};
    const priceSection = sections.find((section) => section.id === 'price');
    if (
      priceSection &&
      priceSection.currentMin !== undefined &&
      priceSection.currentMax !== undefined &&
      (priceSection.currentMin !== 0 || priceSection.currentMax !== (priceSection.max || 1000))
    ) {
      filters.ourPrice = {
        min: Math.max(priceSection.currentMin, 0),
        max: Math.min(priceSection.currentMax, priceSection.max || 1000),
      };
    }

    sections.forEach((section) => {
      if (section.type === 'checkbox' && section.options) {
        const selectedOptions = section.options
          .filter((option) => option.checked)
          .map((option) => option.id);
        if (selectedOptions.length > 0) {
          filters[section.id] = selectedOptions;
        }
      }
    });

    if (excludeOOS) {
      filters.inStock = true;
    }

    return filters;
  };

  const toggleSection = (sectionId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    setExpanded((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleCheckboxChange = (sectionId: string, optionId: string) => {
    const updatedSections = filterSections.map((section) => {
      if (section.id === sectionId && section.options) {
        return {
          ...section,
          options: section.options.map((option) =>
            option.id === optionId ? { ...option, checked: !option.checked } : option
          ),
        };
      }
      return section;
    });

    setFilterSections(updatedSections);
    applyFilters(updatedSections, excludeOutOfStock);
  };

  const handlePriceChange = (sectionId: string, values: number[]) => {
    const [newMin, newMax] = values;
    const updatedSections = filterSections.map((section) => {
      if (section.id === sectionId && section.type === 'range') {
        return {
          ...section,
          currentMin: Math.max(newMin, 0),
          currentMax: Math.min(newMax, section.max || 1000),
        };
      }
      return section;
    });

    setFilterSections(updatedSections);
    applyFilters(updatedSections, excludeOutOfStock);
  };

  const handlePriceInputChange = (sectionId: string, type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    const updatedSections = filterSections.map((section) => {
      if (section.id === sectionId && section.type === 'range') {
        const min = type === 'min' ? numValue ?? 0 : section.currentMin ?? 0;
        const max = type === 'max' ? numValue ?? section.max ?? 1000 : section.currentMax ?? section.max ?? 1000;
        return {
          ...section,
          currentMin: Math.max(min, 0),
          currentMax: Math.min(max, section.max || 1000),
        };
      }
      return section;
    });

    setFilterSections(updatedSections);
    applyFilters(updatedSections, excludeOutOfStock);
  };

  const handleViewMore = (sectionId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    setVisibleOptions((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId] === 5 ? Number.MAX_SAFE_INTEGER : 5,
    }));
  };

  const handleOutOfStockChange = () => {
    const newValue = !excludeOutOfStock;
    setExcludeOutOfStock(newValue);
    applyFilters(filterSections, newValue);
  };

  const applyFilters = (sections: FilterSection[], excludeOOS: boolean) => {
    const filters = getFilterValues(sections, excludeOOS);
    updateUrlParams(filters);
    onFilterChange(filters);
  };

  const updateUrlParams = (filters: FilterValues) => {
    const params = new URLSearchParams(searchParams.toString());
    const possibleFilterKeys = [
      'minPrice',
      'maxPrice',
      'color',
      'brand',
      'category',
      'rating',
      'inStock',
      'storage',
      ...Object.keys(filterOptions.attributes),
    ];
    possibleFilterKeys.forEach((key) => params.delete(key));

    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'ourPrice' && typeof value === 'object' && 'min' in value && 'max' in value) {
        params.set('minPrice', value.min.toString());
        params.set('maxPrice', value.max.toString());
      } else if (Array.isArray(value)) {
        value.forEach((val) => params.append(key, val));
      } else if (typeof value === 'boolean') {
        params.set(key, value.toString());
      }
    });

    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.pushState({}, '', url.toString());
  };

  const clearFilters = () => {
    const resetSections = filterSections.map((section) => {
      if (section.type === 'checkbox' && section.options) {
        return {
          ...section,
          options: section.options.map((option) => ({ ...option, checked: false })),
        };
      }
      if (section.type === 'range') {
        return {
          ...section,
          currentMin: 0,
          currentMax: section.max ?? 1000,
        };
      }
      return section;
    });

    setFilterSections(resetSections);
    setExcludeOutOfStock(false);
    setVisibleOptions((prev) => {
      const newVisible = { ...prev };
      resetSections.forEach((section) => {
        newVisible[section.id] = 5;
      });
      return newVisible;
    });

    const url = new URL(window.location.href);
    url.search = '';
    window.history.pushState({}, '', url.toString());
    applyFilters(resetSections, false);
  };

  const getAppliedFilterCount = () => {
    let count = 0;
    filterSections.forEach((section) => {
      if (section.type === 'checkbox' && section.options) {
        count += section.options.filter((option) => option.checked).length;
      }
      if (
        section.type === 'range' &&
        section.currentMin !== undefined &&
        section.currentMax !== undefined &&
        (section.currentMin !== 0 || section.currentMax !== (section.max || 1000))
      ) {
        count += 1;
      }
    });
    if (excludeOutOfStock) count += 1;
    return count;
  };

  return (
    <div className="w-full">
      {/* Mobile Filter Button */}
      <div className="md:hidden p-3 md:p-4 flex items-center justify-center border border-gray-200 bg-white">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center justify-center text-center text-sm font-medium text-gray-900 transition-colors"
        >
          Filters
          {getAppliedFilterCount() > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 bg-black text-white text-xs px-2 py-1 rounded-full"
            >
              {getAppliedFilterCount()}
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Mobile Modal - 80% Height */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-40 h-full bg-black/50 md:hidden"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 w-full z-100 md:hidden flex items-center justify-center"
            >
              <div className="bg-white  w-full h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    {getAppliedFilterCount() > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-black text-white text-xs px-2 py-1 rounded-full"
                      >
                        {getAppliedFilterCount()}
                      </motion.span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileFiltersOpen(false)}
                    className="text-gray-600 hover:text-gray-900 p-2"
                  >
                    <X size={24} />
                  </motion.button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                  {renderFilterContent()}
                </div>

                {/* Footer */}
                <motion.div
                  className="bg-white p-4 border-t border-gray-200 flex gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearFilters}
                    className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Filter */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 p-4">
        {renderFilterContent()}
      </div>
    </div>
  );

  function renderFilterContent() {
    return (
      <>
        <div className="hidden md:flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-center">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            {getAppliedFilterCount() > 0 && (
              <span className="ml-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                {getAppliedFilterCount()}
              </span>
            )}
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:text-primary/90"
          >
            Clear
          </button>
        </div>

        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <input
              id="excludeOutOfStock"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/90"
              checked={excludeOutOfStock}
              onChange={handleOutOfStockChange}
            />
            <label htmlFor="excludeOutOfStock" className="ml-2 text-sm text-gray-600">
              Exclude out of stock
            </label>
          </div>
        </div>

        {filterSections.map((section, index) => (
          <motion.div
            key={section.id}
            className="border-b border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <motion.button
              type="button"
              className="w-full p-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-lg hover:bg-gray-50 transition-colors"
              onClick={(e) => toggleSection(section.id, e)}
              whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
            >
              <h3 className="text-sm font-medium text-gray-900">{section.title}</h3>
              <motion.div
                animate={{ rotate: expanded[section.id] ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {expanded[section.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expanded[section.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    {section.type === 'range' && (
                      <div>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <div className="flex-1">
                            <input
                              type="number"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              value={section.currentMin ?? 0}
                              min={0}
                              max={section.max ?? 1000}
                              onChange={(e) => handlePriceInputChange(section.id, 'min', e.target.value)}
                              placeholder="Min"
                            />
                          </div>
                          <span className="text-gray-500">-</span>
                          <div className="flex-1">
                            <input
                              type="number"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              value={section.currentMax ?? section.max ?? 1000}
                              min={0}
                              max={section.max ?? 1000}
                              onChange={(e) => handlePriceInputChange(section.id, 'max', e.target.value)}
                              placeholder="Max"
                            />
                          </div>
                        </div>
                        <div className="mt-4 px-2">
                          <Range
                            step={section.step || 1}
                            min={0}
                            max={section.max || 1000}
                            values={[section.currentMin || 0, section.currentMax || section.max || 1000]}
                            onChange={(values) => handlePriceChange(section.id, values)}
                            renderTrack={({ props, children }) => (
                              <div
                                {...props}
                                className="h-1 w-full bg-gray-200 rounded"
                                style={{ ...props.style }}
                              >
                                <div
                                  className="h-1 bg-primary/90 rounded"
                                  style={{
                                    position: 'absolute',
                                    left: `${(section.currentMin || 0) / (section.max || 1000) * 100}%`,
                                    width: `${((section.currentMax || section.max || 1000) - (section.currentMin || 0)) / (section.max || 1000) * 100}%`,
                                  }}
                                />
                                {children}
                              </div>
                            )}
                            renderThumb={({ props }) => (
                              <div
                                {...props}
                                className="h-4 w-4 bg-primary/90 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            )}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-600">
                          <span>₹0</span>
                          <span>₹{section.max || 1000}</span>
                        </div>
                        <div className="text-center mt-2 text-xs text-gray-600 font-medium">
                          ₹{section.currentMin || 0} - ₹{section.currentMax || section.max || 1000}
                        </div>
                      </div>
                    )}
                    {section.type === 'checkbox' && section.options && (
                      <div className="space-y-2 mt-2">
                        {section.options.slice(0, visibleOptions[section.id] || 5).map((option, optIndex) => (
                          <motion.div
                            key={option.id}
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: optIndex * 0.05 }}
                          >
                            <input
                              id={`${section.id}-${option.id}`}
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-primary/90 focus:ring-primary"
                              checked={option.checked}
                              onChange={() => handleCheckboxChange(section.id, option.id)}
                            />
                            <label
                              htmlFor={`${section.id}-${option.id}`}
                              className="ml-2 text-sm text-gray-600"
                            >
                              {option.label}
                            </label>
                          </motion.div>
                        ))}
                        {section.options.length > 5 && (
                          <motion.button
                            type="button"
                            onClick={(e) => handleViewMore(section.id, e)}
                            className="text-xs text-primary/90 hover:text-primary/80 mt-2 font-medium"
                            whileHover={{ x: 2 }}
                          >
                            {visibleOptions[section.id] === 5 ? 'View More' : 'View Less'}
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </>
    );
  }
};

export default DynamicFilter;