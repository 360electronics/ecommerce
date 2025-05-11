'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Range } from 'react-range';
import { Product } from '@/types/product';

interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

interface FilterSection {
  id: string;
  title: string;
  type: 'checkbox' | 'range' | 'radio';
  options?: FilterOption[];
  min?: number;
  max?: number;
  currentMin?: number;
  currentMax?: number;
  step?: number;
}

interface FilterProps {
  category?: string;
  products: Product[];
  onFilterChange: (filters: FilterValues) => void;
}

interface FilterValues {
  [key: string]: string[] | boolean | { min: number; max: number };
}



// Filter configuration for customizable order and visibility
const filterConfig = [
  { id: 'price', title: 'Price', type: 'range', step: 10, enabled: true },
  { id: 'color', title: 'Color', type: 'checkbox', enabled: true },
  { id: 'size', title: 'Size', type: 'checkbox', enabled: true },
  { id: 'brand', title: 'Brands', type: 'checkbox', enabled: true },
  { id: 'category', title: 'Categories', type: 'checkbox', enabled: true },
  { id: 'material', title: 'Material', type: 'checkbox', enabled: true },
  { id: 'rating', title: 'Rating', type: 'checkbox', enabled: true },
] as const;

const DynamicFilter: React.FC<FilterProps> = ({ category, products, onFilterChange }) => {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [filterSections, setFilterSections] = useState<FilterSection[]>([]);
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState<{ [key: string]: number }>({});
  const searchParams = useSearchParams();
  // const router = useRouter();

  // Generate price range from products

  const generatePriceRange = (products: Product[]) => {
    if (products.length === 0) {
      return { min: 0, max: 1000 };
    }

    const prices = products
      .map((product) => Number(product.ourPrice))
      .filter((price) => !isNaN(price) && price > 0);

    if (prices.length === 0) {
      return { min: 0, max: 1000 };
    }

    const minPrice = 100;
    const maxPrice = Math.ceil(Math.max(...prices));

    return {
      min: minPrice,
      max: maxPrice,
    };
  };

  // Generate options for checkbox filters
  const generateOptions = (products: Product[], key: keyof Product) => {
    const uniqueValues = new Set<string>();

    products.forEach((product) => {
      const value = product[key];
      if (value && typeof value === 'string') {
        uniqueValues.add(value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => typeof v === 'string' && uniqueValues.add(v));
      }
    });

    return Array.from(uniqueValues)
      .sort()
      .map((value) => ({
        id: value,
        label: value,
        checked: false,
      }));
  };

  // Generate rating options based on product ratings
  const generateRatingOptions = (products: Product[]) => {
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

  // Generate filter sections based on products
  const generatedSections = useMemo(() => {
    if (!products || products.length === 0) return [];

    const sections: FilterSection[] = [];
    const priceRange = generatePriceRange(products);
    const colorOptions = generateOptions(products, 'color');
    const brandOptions = generateOptions(products, 'brand');
    const categoryOptions = category ? [] : generateOptions(products, 'category');
    const materialOptions = generateOptions(products, 'material');
    const ratingOptions = generateRatingOptions(products);

    const optionsMap: { [key: string]: FilterOption[] } = {
      color: colorOptions,
      brand: brandOptions,
      category: categoryOptions,
      material: materialOptions,
      rating: ratingOptions,
    };

    filterConfig.forEach((config) => {
      if (!config.enabled) return;

      if (config.type === 'range' && config.id === 'price') {
        sections.push({
          id: 'price',
          title: config.title,
          type: 'range',
          min: priceRange.min,
          max: priceRange.max,
          currentMin: priceRange.min,
          currentMax: priceRange.max,
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

    return sections;
  }, [products, category]);

  useEffect(() => {
    if (generatedSections.length === 0) return;

    setFilterSections(generatedSections);

    const initialExpanded: { [key: string]: boolean } = {};
    const initialVisibleOptions: { [key: string]: number } = {};
    generatedSections.forEach((section) => {
      initialExpanded[section.id] = true;
      initialVisibleOptions[section.id] = 5;
    });
    setExpanded(initialExpanded);
    setVisibleOptions(initialVisibleOptions);
  }, [generatedSections]);

  // Replace the useEffect that handles URL params with this updated version
  useEffect(() => {
    if (filterSections.length === 0) return;

    let hasChanges = false;

    const updatedSections = filterSections.map((section) => {
      if (section.id === 'price') {
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');

        if (minPrice && maxPrice) {
          const newMin = Number(minPrice);
          const newMax = Number(maxPrice);

          if (!isNaN(newMin) && !isNaN(newMax) &&
            (newMin !== section.currentMin || newMax !== section.currentMax)) {
            hasChanges = true;
            return {
              ...section,
              currentMin: newMin,
              currentMax: newMax,
            };
          }
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
            return {
              ...section,
              options: newOptions,
            };
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
      setFilterSections(updatedSections);
      onFilterChange(getFilterValues(updatedSections, excludeOOS));
    }
  }, [searchParams]);

  // Add this helper function to extract filter values consistently
  const getFilterValues = (sections: FilterSection[], excludeOOS: boolean) => {
    const filters: FilterValues = {};

    const priceSection = sections.find((section) => section.id === 'price');
    if (priceSection && priceSection.currentMin !== undefined && priceSection.currentMax !== undefined) {
      filters.ourPrice = {
        min: Number(priceSection.currentMin),
        max: Number(priceSection.currentMax),
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



  const toggleSection = (sectionId: string) => {
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

  const handlePriceChange = (sectionId: string, min: number | undefined, max: number | undefined) => {
    const updatedSections = filterSections.map((section) => {
      if (section.id === sectionId) {
        const newMin = min !== undefined ? Math.min(min, max || section.max || 1000) : section.min;
        const newMax = max !== undefined ? Math.max(max, min || section.min || 0) : section.max;
        return {
          ...section,
          currentMin: newMin,
          currentMax: newMax,
        };
      }
      return section;
    });

    setFilterSections(updatedSections);
    applyFilters(updatedSections, excludeOutOfStock);
  };

  const handleOutOfStockChange = () => {
    const newValue = !excludeOutOfStock;
    setExcludeOutOfStock(newValue);
    applyFilters(filterSections, newValue);
  };

  const handleViewMore = (sectionId: string) => {
    setVisibleOptions((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId] === 5 ? Number.MAX_SAFE_INTEGER : 5,
    }));
  };

  // Update the applyFilters function to use getFilterValues
  const applyFilters = (sections: FilterSection[], excludeOOS: boolean) => {
    const filters = getFilterValues(sections, excludeOOS);
    updateUrlParams(filters);
    onFilterChange(filters);
  };



  const updateUrlParams = (filters: FilterValues) => {
    const params = new URLSearchParams(searchParams.toString());

    const possibleFilterKeys = ['minPrice', 'maxPrice', 'price', 'color', 'brand', 'category', 'material', 'rating', 'inStock'];
    possibleFilterKeys.forEach((key) => params.delete(key));

    let hasChanges = false;
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'ourPrice' && typeof value === 'object' && 'min' in value && 'max' in value) {
        const priceValue = value as { min: number; max: number };
        const currentMin = params.get('minPrice');
        const currentMax = params.get('maxPrice');
        if (currentMin !== priceValue.min.toString() || currentMax !== priceValue.max.toString()) {
          hasChanges = true;
          params.set('minPrice', priceValue.min.toString());
          params.set('maxPrice', priceValue.max.toString());
        }
      } else if (Array.isArray(value)) {
        const currentValues = params.getAll(key);
        if (JSON.stringify(currentValues.sort()) !== JSON.stringify(value.sort())) {
          hasChanges = true;
          value.forEach((val) => params.append(key, val));
        }
      } else if (typeof value === 'boolean') {
        const currentValue = params.get(key);
        if (currentValue !== value.toString()) {
          hasChanges = true;
          params.set(key, value.toString());
        }
      }
    });

    if (hasChanges) {
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.pushState({}, '', url.toString());
    }
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
          currentMin: section.min,
          currentMax: section.max,
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
        (section.currentMin !== section.min || section.currentMax !== section.max)
      ) {
        count += 1;
      }
    });

    if (excludeOutOfStock) count += 1;

    return count;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="md:hidden p-4 flex items-center justify-between border-b border-gray-200">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center text-sm font-medium text-gray-900"
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
          <div className="fixed top-0 right-0 w-3/4 max-w-sm bg-white h-full overflow-y-auto">
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

      <div className="hidden md:block">
        {renderFilterContent()}
      </div>
    </div>
  );

  function renderFilterContent() {
    return (
      <>
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
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
            className="text-sm text-gray-600 hover:text-gray-900"
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
              className="w-full p-4 flex items-center justify-between text-left"
              onClick={() => toggleSection(section.id)}
              aria-expanded={expanded[section.id]}
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
                          value={section.currentMin !== undefined ? section.currentMin : ''}
                          min={section.min}
                          max={section.max}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                            handlePriceChange(section.id, value, section.currentMax);
                          }}
                          placeholder="Min"
                          aria-label={`Minimum ${section.title}`}
                        />
                      </div>
                      <span className="text-gray-500 mx-2">-</span>
                      <div className="flex-1 pl-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={section.currentMax !== undefined ? section.currentMax : ''}
                          min={section.min}
                          max={section.max}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                            handlePriceChange(section.id, section.currentMin, value);
                          }}
                          placeholder="Max"
                          aria-label={`Maximum ${section.title}`}
                        />
                      </div>
                    </div>
                    <div className="mt-4 px-2">
                      <Range
                        step={section.step || 1}
                        min={section.min || 0}
                        max={section.max || 1000}
                        values={[
                          section.currentMin !== undefined ? section.currentMin : section.min || 0,
                          section.currentMax !== undefined ? section.currentMax : section.max || 1000,
                        ]}
                        onChange={(values) => {
                          handlePriceChange(section.id, values[0], values[1]);
                        }}
                        renderTrack={({ props, children }) => (
                          <div
                            {...props}
                            className="h-1 w-full bg-gray-300 rounded"
                            style={{ ...props.style }}
                          >
                            <div
                              className="h-1 bg-blue-600 rounded"
                              style={{
                                position: 'absolute',
                                left: `${((section.currentMin || section.min || 0) - (section.min || 0)) /
                                  ((section.max || 1000) - (section.min || 0)) * 100
                                  }%`,
                                width: `${((section.currentMax || section.max || 1000) - (section.currentMin || section.min || 0)) /
                                  ((section.max || 1000) - (section.min || 0)) * 100
                                  }%`,
                              }}
                            />
                            {children}
                          </div>
                        )}
                        renderThumb={({ props, index }) => {
                          const { key, ...restProps } = props; // Destructure key and collect remaining props
                          return (
                            <div
                              key={key} // Explicitly pass the key prop
                              {...restProps} // Spread the remaining props
                              className="h-4 w-4 bg-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label={index === 0 ? `Minimum ${section.title} thumb` : `Maximum ${section.title} thumb`}
                            />
                          );
                        }}
                      />
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
                  </div>
                )}

                {section.options && section.options.length > 5 && (
                  <button
                    type="button"
                    onClick={() => handleViewMore(section.id)}
                    className="text-xs text-gray-600 hover:text-blue-600 mt-2"
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
        ))}
      </>
    );
  }
};

export default DynamicFilter;