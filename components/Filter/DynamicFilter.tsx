'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Range } from 'react-range';
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

  const roundMaxPrice = (max: number): number => {
    if (max <= 0) return 1000; // Fallback for invalid max
    if (max <= 1000) return Math.ceil(max / 100) * 100; // Round to nearest 100
    return Math.ceil(max / 1000) * 1000; // Round to nearest 1000
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

    console.log('Generated Sections:', sections);
    return sections;
  }, [products, category, filterOptions]);

  useEffect(() => {
    if (generatedSections.length === 0) return;

    setExpanded((prev) => {
      const newExpanded = { ...prev };
      generatedSections.forEach((section, index) => {
        if (!(section.id in newExpanded)) {
          newExpanded[section.id] = index < 4;
        }
      });
      console.log('Expanded State:', newExpanded);
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
  }, [generatedSections]);

  useEffect(() => {
    if (filterSections.length === 0) return;

    let hasChanges = false;
    const updatedSections = filterSections.map((section) => {
      if (section.type === 'range' && section.id === 'price') {
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const newMin = minPrice ? Math.max(Number(minPrice), 0) : 0;
        const newMax = maxPrice ? Math.min(Number(maxPrice), section.max || 1000) : section.max || 1000;

        if (!isNaN(newMin) && !isNaN(newMax) && (newMin !== section.currentMin || newMax !== section.currentMax)) {
          hasChanges = true;
          return { ...section, currentMin: newMin, currentMax: newMax };
        }
      } else if (section.type === 'checkbox' && section.options) {
        const paramValues = searchParams.getAll(section.id);
        if (paramValues.length > 0) {
          const newOptions = section.options.map((option) => ({
            ...option,
            checked: paramValues.includes(option.id),
          }));
          if (JSON.stringify(newOptions) !== JSON.stringify(section.options)) {
            hasChanges = true;
            return { ...section, options: newOptions };
          }
        }
      }
      return section;
    });

    const excludeOOS = searchParams.get('inStock') === 'true';
    if (excludeOOS !== excludeOutOfStock) {
      hasChanges = true;
      setExcludeOutOfStock(excludeOOS);
    }

    if (hasChanges) {
      console.log('Applying URL params to filters:', updatedSections);
      setFilterSections(updatedSections);
      onFilterChange(getFilterValues(updatedSections, excludeOOS));
    }
  }, [searchParams, filterSections, excludeOutOfStock, onFilterChange]);

  const getFilterValues = (sections: FilterSection[], excludeOOS: boolean) => {
    const filters: FilterValues = {};
    const priceSection = sections.find((section) => section.id === 'price');
    if (
      priceSection &&
      priceSection.currentMin !== undefined &&
      priceSection.currentMax !== undefined &&
      (priceSection.currentMin !== 0 || priceSection.currentMax !== (priceSection.max || 1000))
    ) {
      filters. Hawkins = {
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

    console.log('Filter Values:', filters);
    return filters;
  };

  const toggleSection = (sectionId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    setExpanded((prev) => {
      const newExpanded = { ...prev, [sectionId]: !prev[sectionId] };
      console.log('Toggled Section:', { sectionId, expanded: newExpanded[sectionId] });
      return newExpanded;
    });
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

    console.log('Price Change:', { sectionId, newMin, newMax });
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

    console.log('Price Input Change:', { sectionId, type, value });
    setFilterSections(updatedSections);
    applyFilters(updatedSections, excludeOutOfStock);
  };

  const handleViewMore = (sectionId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    setVisibleOptions((prev) => {
      const newVisible = { ...prev, [sectionId]: prev[sectionId] === 5 ? Number.MAX_SAFE_INTEGER : 5 };
      console.log('View More Toggled:', { sectionId, visible: newVisible[sectionId] });
      return newVisible;
    });
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
    <div className="w-full bg-white md:rounded-lg md:border border-gray-200">
      <div className="md:hidden p-4 flex items-center justify-center border-y border-gray-200">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center justify-center text-center text-sm font-medium text-gray-900"
          aria-label={`Open filters${getAppliedFilterCount() > 0 ? `, ${getAppliedFilterCount()} applied` : ''}`}
        >
          Filters
          {getAppliedFilterCount() > 0 && (
            <span className="ml-2 bg-black text-white text-xs px-2 py-1 rounded-full">
              {getAppliedFilterCount()}
            </span>
          )}
        </button>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden">
          <div className="fixed top-0 right-0 w-full bg-white h-full overflow-y-auto">
            <div className="p-4 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Close filters"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">{renderFilterContent()}</div>
          </div>
        </div>
      )}

      <div className="hidden md:block p-4">{renderFilterContent()}</div>
    </div>
  );

  function renderFilterContent() {
    return (
      <>
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
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
            className="text-sm text-blue-600 hover:text-blue-800"
            aria-label="Clear all filters"
          >
            Clear
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <input
              id="excludeOutOfStock"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={excludeOutOfStock}
              onChange={handleOutOfStockChange}
              aria-label="Exclude out of stock products"
            />
            <label htmlFor="excludeOutOfStock" className="ml-2 text-sm text-gray-600">
              Exclude out of stock
            </label>
          </div>
        </div>

        {filterSections.map((section) => (
          <div key={section.id} className="border-b border-gray-200">
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => toggleSection(section.id, e)}
              onKeyDown={(e) => e.key === 'Enter' && toggleSection(section.id, e)}
              aria-expanded={expanded[section.id] ?? false}
              aria-controls={`filter-section-${section.id}`}
            >
              <h3 className="text-sm font-medium text-gray-900">{section.title}</h3>
              {expanded[section.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expanded[section.id] && (
              <div id={`filter-section-${section.id}`} className="px-4 pb-4">
                {section.type === 'range' && (
                  <div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex-1 pr-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={section.currentMin ?? 0}
                          min={0}
                          max={section.max ?? 1000}
                          onChange={(e) => handlePriceInputChange(section.id, 'min', e.target.value)}
                          placeholder="Min"
                          aria-label={`Minimum ${section.title}`}
                        />
                      </div>
                      <span className="text-gray-500 mx-2">-</span>
                      <div className="flex-1 pl-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={section.currentMax ?? section.max ?? 1000}
                          min={0}
                          max={section.max ?? 1000}
                          onChange={(e) => handlePriceInputChange(section.id, 'max', e.target.value)}
                          placeholder="Max"
                          aria-label={`Maximum ${section.title}`}
                        />
                      </div>
                    </div>
                    <div className="mt-4 px-4">
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
                              className="h-1 bg-blue-600 rounded"
                              style={{
                                position: 'absolute',
                                left: `${(section.currentMin || 0) / (section.max || 1000) * 100}%`,
                                width: `${((section.currentMax || section.max || 1000) - (section.currentMin || 0)) / (section.max || 1000) * 100}%`,
                              }}
                            />
                            {children}
                          </div>
                        )}
                        renderThumb={({ props, index }) => (
                          <div
                            {...props}
                            className="h-4 w-4 bg-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={index === 0 ? `Minimum ${section.title} thumb` : `Maximum ${section.title} thumb`}
                          />
                        )}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>$0</span>
                      <span>${section.max || 1000}</span>
                    </div>
                    <div className="text-center mt-2 text-xs text-gray-600">
                      ${section.currentMin || 0} - ${section.currentMax || section.max || 1000}
                    </div>
                  </div>
                )}
                {section.type === 'checkbox' && section.options && (
                  <div className="space-y-2 mt-2">
                    {section.options.slice(0, visibleOptions[section.id] || 5).map((option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          id={`${section.id}-${option.id}`}
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={option.checked}
                          onChange={() => handleCheckboxChange(section.id, option.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCheckboxChange(section.id, option.id)}
                          aria-label={`${section.title}: ${option.label}`}
                        />
                        <label
                          htmlFor={`${section.id}-${option.id}`}
                          className="ml-2 text-sm text-gray-600"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                    {section.options.length > 5 && (
                      <button
                        type="button"
                        onClick={(e) => handleViewMore(section.id, e)}
                        onKeyDown={(e) => e.key === 'Enter' && handleViewMore(section.id, e)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                        aria-label={
                          visibleOptions[section.id] === 5
                            ? `Show more ${section.title} options`
                            : `Show fewer ${section.title} options`
                        }
                      >
                        {visibleOptions[section.id] === 5 ? 'View More' : 'View Less'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </>
    );
  }
};

export default DynamicFilter;