'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

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
}

interface FilterProps {
  category?: string;
  products: any[];
  onFilterChange: (filters: any) => void;
}

// Define a type for our filter values
interface FilterValues {
  [key: string]: string[] | boolean | { min: number; max: number };
}

const DynamicFilter: React.FC<FilterProps> = ({ category, products, onFilterChange }) => {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [filterSections, setFilterSections] = useState<FilterSection[]>([]);
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Generate filter sections based on products
  useEffect(() => {
    if (!products || products.length === 0) return;

    const sections: FilterSection[] = [];
    const priceRange = generatePriceRange(products);
    const colorOptions = generateOptions(products, 'color');
    const brandOptions = generateOptions(products, 'brand');
    const sizeOptions = generateOptions(products, 'size');
    
    // Categories might be inferred from products or passed directly
    const categoryOptions = category ? [] : generateOptions(products, 'category');

    // Add price range filter
    sections.push({
      id: 'price',
      title: 'Price',
      type: 'range',
      min: priceRange.min,
      max: priceRange.max,
      currentMin: priceRange.min,
      currentMax: priceRange.max,
    });

    // Add color filter if colors exist
    if (colorOptions.length > 0) {
      sections.push({
        id: 'color',
        title: 'Color',
        type: 'checkbox',
        options: colorOptions,
      });
    }

    // Add size filter if sizes exist
    if (sizeOptions.length > 0) {
      sections.push({
        id: 'size',
        title: 'Size',
        type: 'checkbox',
        options: sizeOptions,
      });
    }

    // Add brand filter if brands exist
    if (brandOptions.length > 0) {
      sections.push({
        id: 'brand',
        title: 'Brands',
        type: 'checkbox',
        options: brandOptions,
      });
    }

    // Add category filter if categories exist and no specific category is provided
    if (categoryOptions.length > 0 && !category) {
      sections.push({
        id: 'category',
        title: 'Categories',
        type: 'checkbox',
        options: categoryOptions,
      });
    }

    // Add any other dynamic filters based on product attributes
    // Example: Material, Features, etc.
    const materialOptions = generateOptions(products, 'material');
    if (materialOptions.length > 0) {
      sections.push({
        id: 'material',
        title: 'Material',
        type: 'checkbox',
        options: materialOptions,
      });
    }

    // Ratings filter is usually static but could be dynamic
    sections.push({
      id: 'rating',
      title: 'Rating',
      type: 'checkbox',
      options: [
        { id: '5', label: '5 Stars', checked: false },
        { id: '4', label: '4 Stars & Up', checked: false },
        { id: '3', label: '3 Stars & Up', checked: false },
        { id: '2', label: '2 Stars & Up', checked: false },
        { id: '1', label: '1 Star & Up', checked: false },
      ],
    });

    // Initialize all sections as expanded
    const initialExpanded: { [key: string]: boolean } = {};
    sections.forEach(section => {
      initialExpanded[section.id] = true;
    });
    setExpanded(initialExpanded);
    
    setFilterSections(sections);
  }, [products, category]);

  // Apply filters from URL params
  useEffect(() => {
    if (filterSections.length === 0) return;
    
    const updatedSections = [...filterSections];
    
    // Handle price range from URL
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const priceSection = updatedSections.find(section => section.id === 'price');
    if (priceSection && minPrice && maxPrice) {
      priceSection.currentMin = Number(minPrice);
      priceSection.currentMax = Number(maxPrice);
    }
    
    // Handle checkbox filters from URL
    updatedSections.forEach(section => {
      if (section.type === 'checkbox' && section.options) {
        const paramValues = searchParams.getAll(section.id);
        if (paramValues.length > 0) {
          section.options = section.options.map(option => ({
            ...option,
            checked: paramValues.includes(option.id)
          }));
        }
      }
    });
    
    // Handle out of stock filter
    const excludeOOS = searchParams.get('inStock') === 'true';
    setExcludeOutOfStock(excludeOOS);
    
    setFilterSections(updatedSections);
  }, [searchParams]);

  // Generate price range from products
  const generatePriceRange = (products: any[]) => {
    const prices = products.map(product => Number(product.price));
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  };

  // Generate options for checkbox filters
  const generateOptions = (products: any[], key: string) => {
    const uniqueValues = new Set<string>();
    
    products.forEach(product => {
      if (product[key]) {
        if (Array.isArray(product[key])) {
          product[key].forEach((value: string) => uniqueValues.add(value));
        } else {
          uniqueValues.add(product[key]);
        }
      }
    });
    
    return Array.from(uniqueValues).map(value => ({
      id: value.toString(),
      label: value.toString(),
      checked: false
    }));
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpanded(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (sectionId: string, optionId: string) => {
    const updatedSections = filterSections.map(section => {
      if (section.id === sectionId && section.options) {
        return {
          ...section,
          options: section.options.map(option => 
            option.id === optionId ? { ...option, checked: !option.checked } : option
          )
        };
      }
      return section;
    });
    
    setFilterSections(updatedSections);
    applyFilters(updatedSections, excludeOutOfStock);
  };

  // Handle price range change
  const handlePriceChange = (min: number, max: number) => {
    const updatedSections = filterSections.map(section => {
      if (section.id === 'price') {
        return {
          ...section,
          currentMin: min,
          currentMax: max
        };
      }
      return section;
    });
    
    setFilterSections(updatedSections);
    applyFilters(updatedSections, excludeOutOfStock);
  };

  // Handle out of stock filter
  const handleOutOfStockChange = () => {
    const newValue = !excludeOutOfStock;
    setExcludeOutOfStock(newValue);
    applyFilters(filterSections, newValue);
  };

  // Apply all filters
  const applyFilters = (sections: FilterSection[], excludeOOS: boolean) => {
    const filters: FilterValues = {};
    
    // Add price filter
    const priceSection = sections.find(section => section.id === 'price');
    if (priceSection) {
      filters.price = {
        min: priceSection.currentMin || 0,
        max: priceSection.currentMax || 0
      };
    }
    
    // Add checkbox filters
    sections.forEach(section => {
      if (section.type === 'checkbox' && section.options) {
        const selectedOptions = section.options
          .filter(option => option.checked)
          .map(option => option.id);
        
        if (selectedOptions.length > 0) {
          filters[section.id] = selectedOptions;
        }
      }
    });
    
    // Add stock filter
    if (excludeOOS) {
      filters.inStock = true;
    }
    
    // Update URL parameters
    updateUrlParams(filters);
    
    // Notify parent component
    onFilterChange(filters);
  };

  // Update URL parameters with filter values
  const updateUrlParams = (filters: FilterValues) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Clear existing filter params
    Object.keys(filters).forEach(key => {
      params.delete(key);
      if (key === 'price') {
        params.delete('minPrice');
        params.delete('maxPrice');
      }
    });
    
    // Set new filter params
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'price' && typeof value === 'object' && 'min' in value && 'max' in value) {
        const priceValue = value as { min: number, max: number };
        params.set('minPrice', priceValue.min.toString());
        params.set('maxPrice', priceValue.max.toString());
      } else if (Array.isArray(value)) {
        value.forEach(val => params.append(key, val));
      } else if (typeof value === 'boolean') {
        params.set(key, value.toString());
      }
    });
    
    // Update URL without forcing refresh
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.pushState({}, '', url.toString());
  };

  // Clear all filters
  const clearFilters = () => {
    const resetSections = filterSections.map(section => {
      if (section.type === 'checkbox' && section.options) {
        return {
          ...section,
          options: section.options.map(option => ({ ...option, checked: false }))
        };
      }
      if (section.type === 'range') {
        return {
          ...section,
          currentMin: section.min,
          currentMax: section.max
        };
      }
      return section;
    });
    
    setFilterSections(resetSections);
    setExcludeOutOfStock(false);
    applyFilters(resetSections, false);
  };

  // Get applied filter count
  const getAppliedFilterCount = () => {
    let count = 0;
    
    filterSections.forEach(section => {
      if (section.type === 'checkbox' && section.options) {
        count += section.options.filter(option => option.checked).length;
      }
      if (section.type === 'range' && section.currentMin !== section.min && section.currentMax !== section.max) {
        count += 1;
      }
    });
    
    if (excludeOutOfStock) count += 1;
    
    return count;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
          />
          <label htmlFor="excludeOutOfStock" className="ml-2 text-sm text-gray-600">
            Exclude out of stock
          </label>
        </div>
      </div>

      {filterSections.map((section) => (
        <div key={section.id} className="border-b border-gray-200">
          <div
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection(section.id)}
          >
            <h3 className="text-sm font-medium text-gray-900">{section.title}</h3>
            {expanded[section.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {expanded[section.id] && (
            <div className="px-4 pb-4">
              {section.type === 'range' && (
                <div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex-1 pr-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                        value={section.currentMin}
                        onChange={(e) => handlePriceChange(
                          Number(e.target.value),
                          section.currentMax || 0
                        )}
                      />
                    </div>
                    <span className="text-gray-500 mx-2">-</span>
                    <div className="flex-1 pl-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                        value={section.currentMax}
                        onChange={(e) => handlePriceChange(
                          section.currentMin || 0,
                          Number(e.target.value)
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-4 px-2">
                    <input
                      type="range"
                      min={section.min}
                      max={section.max}
                      value={section.currentMin}
                      onChange={(e) => handlePriceChange(
                        Number(e.target.value),
                        section.currentMax || 0
                      )}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min={section.min}
                      max={section.max}
                      value={section.currentMax}
                      onChange={(e) => handlePriceChange(
                        section.currentMin || 0,
                        Number(e.target.value)
                      )}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {section.type === 'checkbox' && section.options && (
                <div className="space-y-2 mt-2">
                  {section.options.map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        id={`${section.id}-${option.id}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={option.checked}
                        onChange={() => handleCheckboxChange(section.id, option.id)}
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
                  onClick={() => {}}
                  className="text-xs text-gray-600 hover:text-blue-600 mt-2"
                >
                  View More
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicFilter;