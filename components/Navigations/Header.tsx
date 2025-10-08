'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import LocationPicker from './Header/LocationPicker';
import SearchBar from './Header/Search/SearchBar';
import WishlistButton from './Header/WishlistButton';
import UserButton from './Header/UserButton';
import CartButton from './Header/CartButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ShoppingBag, Heart, User, ChevronDown, Building, ArrowBigRight, ArrowUpRight } from 'lucide-react';
import { slugify } from '@/utils/slugify';
import { fetchProducts } from '@/utils/products.util';

interface HeaderProps {
  isCategory?: boolean;
}

interface Attribute {
  name: string | null;
  type: 'text' | 'number' | 'boolean' | 'select' | null;
  unit?: string | null;
  options?: string[] | null;
  isRequired: boolean | null;
  isFilterable: boolean | null;
  displayOrder: number | null;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: string;
  attributes: Attribute[];
  subCategories: SubCategory[];
  attributeValues: { [key: string]: string[] };
}

interface CategoryResponse {
  [slug: string]: {
    category: {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      isActive: boolean;
      displayOrder: string;
    };
    attributes: Attribute[];
    subcategories: SubCategory[];
  };
}

interface Product {
  id: string;
  categoryId: string;
  subcategoryId: string;
  variants: Array<{
    attributes: { [key: string]: string };
  }>;
}

const CACHE_KEY = 'header_data_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

const Header = ({ isCategory = true }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredAttribute, setHoveredAttribute] = useState<string | null>(null);
  const [hoveredAllCategories, setHoveredAllCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attributeRef = useRef<HTMLDivElement>(null);

  // Define allowed categories with corrected display name
  const allowedCategories = new Set(['Laptops', 'Processors', 'Graphics Card', 'Monitors', 'Accessories']);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const { categories: cachedCategories, allCategories: cachedAllCategories, timestamp } = parsed || {};
          const now = Date.now();
          if (now - timestamp < CACHE_DURATION && Array.isArray(cachedCategories) && Array.isArray(cachedAllCategories)) {
            setCategories(cachedCategories);
            setAllCategories(cachedAllCategories);
            setHasFetched(true);
            return;
          }
        } catch (e) {
          console.error('Cache parse error:', e);
          sessionStorage.removeItem(CACHE_KEY);
        }
      }
    }

    const normalizeValue = (val: string): string => {
      if (!val) return "";

      let v = val.trim().replace(/\s+/g, " ").toLowerCase();
      let brand = "";

      // --- Detect explicit brand ---
      if (/\bamd\b/i.test(v)) brand = "AMD";
      else if (/\bintel\b/i.test(v)) brand = "Intel";
      else if (/\bnvidia\b/i.test(v)) brand = "NVIDIA";
      else if (/\bmsi\b/i.test(v)) brand = "MSI";
      else if (/\basus\b/i.test(v)) brand = "Asus";

      // --- Remove duplicate brand mentions ---
      if (brand) {
        const brandRegex = new RegExp(`\\b(${brand})\\b`, "ig");
        v = v.replace(brandRegex, "").trim();
      }

      // --- Series inference ---
      if (/ryzen\s*[3579]/i.test(v)) {
        if (!brand) brand = "AMD";
        v = v.replace(/ryzen\s*([3579]).*/i, "Ryzen $1");
      }
      if (/core\s*i\s*[3579]/i.test(v)) {
        if (!brand) brand = "Intel";
        v = v.replace(/core\s*i\s*([3579]).*/i, "Core i$1");
      }
      if (/rtx\s*\d+/i.test(v)) {
        if (!brand) brand = "NVIDIA";
        v = v.replace(/geforce\s*/i, "");
        v = v.replace(/\brtx\s*(\d+).*/i, "RTX $1");
      }

      // --- Special inference for laptop lines ---
      if (/tuf\s+gaming/i.test(v)) {
        if (!brand) brand = "Asus";
        v = v.replace(/tuf\s+gaming/i, "TUF Gaming");
      }
      if (/rog\s+/i.test(v)) {
        if (!brand) brand = "Asus";
        v = v.replace(/rog\s+/i, "ROG ");
      }

      // --- Storage normalization ---
      v = v.replace(/(\d+)\s*(gb|ssd|hdd)/i, "$1 GB");
      v = v.replace(/(\d+)(gb|ssd|hdd)/i, "$1 GB");

      // --- Display sizes ---
      v = v.replace(/(\d+(\.\d+)?)\s*cm\s*\((\d+(\.\d+)?)\s*inch\)/i, "$3 inch");

      // --- Collapse duplicate words ---
      v = v.replace(/\b(\w+)( \1\b)+/gi, "$1");

      // --- Title case ---
      v = v.replace(/\b\w/g, (c) => c.toUpperCase());

      // --- Prepend brand (avoid duplicates) ---
      if (brand && !v.startsWith(brand)) {
        v = `${brand} ${v}`;
      }

      return v.trim();
    };


    const fetchData = async () => {
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          fetch('/api/categories'),
          fetchProducts()
        ]);

        console.log('Product Response:', productResponse)

        if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
        // if (!productResponse || productResponse.length === 0) throw new Error('Failed to fetch products');

        const categoryData: CategoryResponse = await categoryResponse.json();
        const productData: Product[] = productResponse;

        const attributeValuesMap: { [categoryId: string]: { [key: string]: Set<string> } } = {};
        productData.forEach((product) => {
          const categoryId = product.categoryId;
          if (!attributeValuesMap[categoryId]) {
            attributeValuesMap[categoryId] = {};
          }
          product.variants.forEach((variant) => {
            Object.entries(variant.attributes).forEach(([key, value]) => {
              if (!attributeValuesMap[categoryId][key]) {
                attributeValuesMap[categoryId][key] = new Set();
              }
              attributeValuesMap[categoryId][key].add(normalizeValue(value));
            });
          });
        });

        const allTemp = Object.values(categoryData)
          .map(({ category, attributes, subcategories }) => ({
            ...category,
            // Normalize Graphics_card to Graphics Card for display
            name: category.name === 'Graphics_cards' ? 'Graphics Card' : category.name,
            attributes,
            subCategories: subcategories,
            attributeValues: attributeValuesMap[category.id]
              ? Object.fromEntries(
                  Object.entries(attributeValuesMap[category.id]).map(([key, valueSet]) => [
                    key,
                    Array.from(valueSet).sort(),
                  ])
                )
              : {},
          }))
          .sort((a, b) => parseInt(a.displayOrder) - parseInt(b.displayOrder));

        const categoryList = allTemp.filter(({ name }) => allowedCategories.has(name));

        setCategories(categoryList);
        setAllCategories(allTemp);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              categories: categoryList,
              allCategories: allTemp,
              timestamp: Date.now(),
            })
          );
        }
        setHasFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        setHasFetched(true);
      }
    };

    fetchData();
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isMenuOpen) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleSearch = (query: string | number | boolean, category: string | number | boolean) => {
    router.push(`/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
    closeMenu();
    setIsSearchOpen(false);
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  };

  const openMenu = () => {
    setIsMenuOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleMouseEnterCategory = (categoryName: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    // Use the normalized name for consistency
    setHoveredCategory(categoryName === 'Graphics_cards' ? 'Graphics Card' : categoryName);
    setHoveredAttribute(null);
  };

  const handleMouseLeaveCategory = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
      setHoveredAttribute(null);
    }, 200);
  };

  const handleMouseEnterAllCategories = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredAllCategories(true);
  };

  const handleMouseLeaveAllCategories = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredAllCategories(false);
    }, 200);
  };

  const handleMouseEnterAttribute = (attrName: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredAttribute(attrName);
  };

  const handleMouseLeaveAttribute = (event: React.MouseEvent) => {
    if (attributeRef.current && !attributeRef.current.contains(event.relatedTarget as Node)) {
      setHoveredAttribute(null);
    }
  };

  const categoryImages: { [key: string]: string } = {
    Laptops: '/header/categories/storage.jpg',
    Processors: '/header/categories/processor.jpg',
    'Graphics Card': '/header/categories/graphics-card.jpg',
    Monitors: '/header/categories/monitors.jpg',
    Accessories: '/header/categories/accessories.jpg',
  };

  return (
    <>
      <header
        className={`w-full bg-white pt-3 px-4 md:px-12 fixed top-0 left-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}
      >
        <div className="mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center">
            <button
              className="mr-2 lg:hidden focus:outline-none"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="flex-shrink-0">
              <img
                src="/logo/logo.png"
                alt="Computer 360 Logo"
                width={150}
                height={150}
                className="h-auto w-[120px]"
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center flex-grow">
            <LocationPicker />
            <div className="flex-grow mx-4">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
          <div className=' px-2'>
            <Link href={'/store-locator'} className=' flex items-center gap-2 font-medium text-sm'>
              <span className=' text-primary'>
                <Building size={20} />
              </span>
              Store Locator
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <WishlistButton />
            <UserButton />
            <CartButton />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <CartButton />
          </div>
        </div>

        {!isMenuOpen && !isSearchOpen && (
          <div className="lg:hidden w-full bg-white py-2 border-t border-gray-200">
            <SearchBar onSearch={handleSearch} />
            <div className="mt-2">
              <LocationPicker isMobile={true} />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-white z-50 lg:hidden overflow-y-auto transition-all duration-300"
            style={{ height: '100dvh' }}
            ref={menuRef}
          >
            <div className="p-4 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Menu</h3>
                <button
                  className="p-2 focus:outline-none"
                  onClick={closeMenu}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="py-4 border-b border-gray-200">
                <Link href="/profile" className="flex items-center py-3" onClick={closeMenu}>
                  <User size={20} className="mr-3 text-gray-700" />
                  <span className="font-medium">My Account</span>
                </Link>
                <Link href="/profile/orders" className="flex items-center py-3" onClick={closeMenu}>
                  <ShoppingBag size={20} className="mr-3 text-gray-700" />
                  <span className="font-medium">My Orders</span>
                </Link>
                <Link href="/profile/wishlist" className="flex items-center py-3" onClick={closeMenu}>
                  <Heart size={20} className="mr-3 text-gray-700" />
                  <span className="font-medium">Wishlist</span>
                </Link>
              </div>

              <div className="py-4 border-b border-gray-200">
                {hasFetched && categories.length === 0 ? (
                  <p className="text-gray-600">No categories available</p>
                ) : (
                  categories.map((category) => {
                    const filterableAttributes = category.attributes.filter(attr => attr.isFilterable === true);
                    return (
                      <div key={category.id} className="mb-4">
                        <Link
                          href={`/category/${category.slug}`}
                          className="block py-2 text-gray-700 hover:text-primary font-medium"
                          onClick={closeMenu}
                        >
                          {category.name}
                        </Link>
                        {category.subCategories.length > 0 && (
                          <div className="ml-4">
                            <h4 className="text-sm font-semibold text-gray-700 mt-2">Explore Subcategories</h4>
                            {category.subCategories.map((subCat) => (
                              <Link
                                key={subCat.id}
                                href={`/category/${category.slug}?subcategory=${subCat.slug}`}
                                className="block py-1 text-sm text-gray-600 hover:text-primary"
                                onClick={closeMenu}
                              >
                                {subCat.name}
                              </Link>
                            ))}
                          </div>
                        )}
                        {filterableAttributes.length > 0 && Object.keys(category.attributeValues).length > 0 && (
                          <div className="ml-4">
                            <h4 className="text-sm font-semibold text-gray-700 mt-2">Filter by Features</h4>
                            {filterableAttributes
                              .filter(attr => category.attributeValues[attr.name!])
                              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                              .map((attr) => (
                                <div key={attr.name} className="py-1">
                                  <button
                                    className="text-sm text-gray-600 hover:text-primary flex items-center"
                                    onClick={() =>
                                      setHoveredAttribute(hoveredAttribute === attr.name ? null : attr.name)
                                    }
                                  >
                                    {attr.name?.replace('_', ' ')}
                                    <ChevronDown
                                      size={14}
                                      className={`ml-1 transform ${hoveredAttribute === attr.name ? 'rotate-180' : ''}`}
                                    />
                                  </button>
                                  {hoveredAttribute === attr.name && (
                                    <div className="ml-4 mt-1">
                                      {category.attributeValues[attr.name!].map((value) => (
                                        <Link
                                          key={value}
                                          href={`/category/${category.slug}?${attr.name}=${encodeURIComponent(value)}`}
                                          className="block text-xs text-gray-500 hover:text-primary py-0.5"
                                          onClick={closeMenu}
                                        >
                                          {value}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="py-4 mt-auto">
                <h3 className="font-bold text-lg mb-3">Help & Support</h3>
                <Link
                  href="/contact"
                  className="block py-2 text-gray-700 hover:text-primary"
                  onClick={closeMenu}
                >
                  Contact Us
                </Link>

              </div>
            </div>
          </div>
        )}

        {/* Desktop Categories Row with Full-Screen Hover Dropdown */}
        {isCategory && (
          <div className="hidden md:block z-40 bg-white">
            <div className="w-full flex items-center justify-center">
              <ul className="flex justify-between w-full space-x-8 py-2 relative">
                <li
                  className="relative"
                  onMouseEnter={handleMouseEnterAllCategories}
                  onMouseLeave={handleMouseLeaveAllCategories}
                >
                  <button className="text-sm font-medium text-gray-800 hover:text-primary transition-colors flex items-center">
                    Categories
                    <ChevronDown
                      size={16}
                      className={`ml-1 transition-transform ${hoveredAllCategories ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {hoveredAllCategories && (
                    <div className="fixed left-0 right-0 top-22 bg-black/30 shadow-lg z-[100]">
                      <div
                        onMouseEnter={() => {
                          if (dropdownTimeoutRef.current) {
                            clearTimeout(dropdownTimeoutRef.current);
                          }
                        }}
                        onMouseLeave={handleMouseLeaveAllCategories}
                        className="max-w-[90%] bg-white mx-auto p-6 grid grid-cols-5 gap-6 h-[calc(100vh-6rem)] overflow-y-auto"
                      >
                        {hasFetched &&
                          allCategories.map((category) => (
                            <div key={category.id} className="w-full">
                              <Link href={`/category/${category.slug}`} className="text-lg font-medium text-gray-800 mb-3 capitalize flex items-center gap-2">
                                {category.name} <ArrowUpRight size={16} className=' text-primary' />
                              </Link>
                              {category.subCategories.length > 0 ? (
                                <ul className="space-y-2">
                                  {category.subCategories.map((subCat) => (
                                    <li key={subCat.id}>
                                      <Link
                                        href={`/category/${category.slug}?subcategory=${subCat.slug}`}
                                        className="block text-sm text-gray-600 hover:text-primary py-1 transition-colors"
                                        onClick={() => setHoveredAllCategories(false)}
                                      >
                                        {subCat.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">No subcategories available</p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </li>
                {hasFetched && categories.length === 0 ? null : (
                  categories.map((category) => {
                    const hasFilterableAttributes = category.attributes.some(attr => attr.isFilterable === true);
                    return (
                      <li
                        key={category.id}
                        className="relative"
                        onMouseEnter={() => handleMouseEnterCategory(category.name)}
                        onMouseLeave={handleMouseLeaveCategory}
                      >
                        <Link
                          href={`/category/${category.slug}`}
                          className="text-sm font-medium text-gray-800 hover:text-primary transition-colors flex items-center"
                        >
                          {category.name}
                          {(category.subCategories.length > 0 || hasFilterableAttributes) && (
                            <ChevronDown size={16} className="ml-1" />
                          )}
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* Full-Screen Dropdown for Individual Categories */}
            {hoveredCategory && (
              <div
                className="fixed left-0 right-0 top-22 bg-black/30 shadow-lg z-[100] "
              >
                <div
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) {
                      clearTimeout(dropdownTimeoutRef.current);
                    }
                  }}
                  onMouseLeave={handleMouseLeaveCategory}
                  className="max-w-[90%] bg-white mx-auto p-6  flex flex-row gap-12 h-[calc(100vh-6rem)] overflow-y-auto"
                >
                  {categories
                    .filter((category) => category.name === hoveredCategory)
                    .map((category) => {
                      const filterableAttributes = category.attributes.filter(attr => attr.isFilterable === true);
                      return (
                        <React.Fragment key={category.id}>
                          {/* Left: Subcategories */}
                          <div className="w-1/2 ">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Explore Subcategories</h3>
                            {category.subCategories.length > 0 ? (
                              <ul className="grid grid-cols-2 gap-2">
                                {category.subCategories.map((subCat) => (
                                  <li key={subCat.id}>
                                    <Link
                                      href={`/category/${category.slug}?subcategory=${subCat.slug}`}
                                      className="block text-sm text-gray-600 hover:text-primary py-1 transition-colors"
                                      onClick={() => setHoveredCategory(null)}
                                    >
                                      {subCat.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No subcategories available</p>
                            )}

                            {/* Category Image */}
                            <div className=" absolute bottom-10 w-full max-w-md">
                              {categoryImages[category.name] && (
                                <img
                                  src={categoryImages[category.name]}
                                  alt={category.name}
                                  width={500}
                                  height={300}
                                  className="object-cover aspect-video"
                                />
                              )}
                            </div>

                          </div>

                          {/* Right: Attributes */}
                          {filterableAttributes.length > 0 && (
                            <div className="w-1/2 relative" ref={attributeRef}>
                              <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Features</h3>
                              <div className="flex flex-row gap-6">
                                <ul className="w-1/2">
                                  {filterableAttributes
                                    .filter(attr => category.attributeValues[attr.name!])
                                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                    .map((attr) => (
                                      <li
                                        key={attr.name}
                                        className="py-1"
                                        onMouseEnter={() => handleMouseEnterAttribute(attr.name!)}
                                      >
                                        <button
                                          className="text-sm cursor-pointer text-gray-600 hover:text-primary transition-colors capitalize"
                                          onMouseLeave={handleMouseLeaveAttribute}
                                        >
                                          {attr.name?.replace('_', ' ')}
                                        </button>
                                      </li>
                                    ))}
                                </ul>
                                {hoveredAttribute && (
                                  <ul className="w-1/2">
                                    {category.attributeValues[hoveredAttribute]?.map((value) => (
                                      <li key={value} className="py-1">
                                        <Link
                                          href={`/category/${category.slug}?${hoveredAttribute}=${encodeURIComponent(value)}`}
                                          className="block text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer"
                                          onClick={() => setHoveredCategory(null)}
                                        >
                                          {value}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default Header;