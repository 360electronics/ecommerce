'use client'
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import LocationPicker from './Header/LocationPicker';
import SearchBar from './Header/Search/SearchBar';
import WishlistButton from './Header/WishlistButton';
import UserButton from './Header/UserButton';
import CartButton from './Header/CartButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ShoppingBag, Heart, User, ChevronDown } from 'lucide-react';
import { slugify } from '@/utils/slugify';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attributeRef = useRef<HTMLDivElement>(null);

  // Fetch and cache data
  useEffect(() => {
    const fetchData = async () => {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      const now = Date.now();
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (now - timestamp < CACHE_DURATION) {
          setCategories(data);
          setIsLoading(false);
          return;
        }
      }

      try {
        const [categoryResponse, productResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);

        if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
        if (!productResponse.ok) throw new Error('Failed to fetch products');

        const categoryData: CategoryResponse = await categoryResponse.json();
        const productData: Product[] = await productResponse.json();

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
              attributeValuesMap[categoryId][key].add(value);
            });
          });
        });

        const categoryList = Object.values(categoryData).map(({ category, attributes, subcategories }) => ({
          ...category,
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
        }));

        setCategories(categoryList);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: categoryList, timestamp: now }));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
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
    setHoveredCategory(categoryName);
    setHoveredAttribute(null);
  };

  const handleMouseLeaveCategory = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
      setHoveredAttribute(null);
    }, 200);
  };

  const handleMouseEnterAttribute = (attrName: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredAttribute(attrName);
  };

  const handleMouseLeaveAttribute = (event: React.MouseEvent) => {
    // Only clear hoveredAttribute if leaving the entire attribute options area
    if (attributeRef.current && !attributeRef.current.contains(event.relatedTarget as Node)) {
      setHoveredAttribute(null);
    }
  };

  return (
    <>
      <header
        className={`w-full bg-white pt-2 px-4 md:px-12 fixed top-0 left-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md' : ''
          }`}
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
              <Image
                src="/logo/360.svg"
                alt="Computer 360 Logo"
                width={150}
                height={150}
                className="h-auto w-[120px]"
                priority
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center flex-grow">
            <LocationPicker />
            <div className="flex-grow mx-4">
              <SearchBar onSearch={handleSearch} />
            </div>
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
                <Link href="/account" className="flex items-center py-3" onClick={closeMenu}>
                  <User size={20} className="mr-3 text-gray-700" />
                  <span className="font-medium">My Account</span>
                </Link>
                <Link href="/orders" className="flex items-center py-3" onClick={closeMenu}>
                  <ShoppingBag size={20} className="mr-3 text-gray-700" />
                  <span className="font-medium">My Orders</span>
                </Link>
                <Link href="/wishlist" className="flex items-center py-3" onClick={closeMenu}>
                  <Heart size={20} className="mr-3 text-gray-700" />
                  <span className="font-medium">Wishlist</span>
                </Link>
              </div>

              <div className="py-4 border-b border-gray-200">
                {isLoading ? (
                  <p className="text-gray-600">Loading...</p>
                ) : (
                  categories.map((category) => (
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
                              href={`/category/${category.slug}/${subCat.slug}`}
                              className="block py-1 text-sm text-gray-600 hover:text-primary"
                              onClick={closeMenu}
                            >
                              {subCat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      {Object.keys(category.attributeValues).length > 0 && (
                        <div className="ml-4">
                          <h4 className="text-sm font-semibold text-gray-700 mt-2">Filter by Features</h4>
                          {Object.entries(category.attributeValues)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([attrName, values]) => (
                              <div key={attrName} className="py-1">
                                <button
                                  className="text-sm text-gray-600 hover:text-primary flex items-center"
                                  onClick={() =>
                                    setHoveredAttribute(hoveredAttribute === attrName ? null : attrName)
                                  }
                                >
                                  {attrName.replace('_', ' ')}
                                  <ChevronDown
                                    size={14}
                                    className={`ml-1 transform ${hoveredAttribute === attrName ? 'rotate-180' : ''
                                      }`}
                                  />
                                </button>
                                {hoveredAttribute === attrName && (
                                  <div className="ml-4 mt-1">
                                    {values.map((value) => (
                                      <Link
                                        key={value}
                                        href={`/category/${category.slug}?${attrName}=${encodeURIComponent(value)}`}
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
                  ))
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
                <Link
                  href="/faq"
                  className="block py-2 text-gray-700 hover:text-primary"
                  onClick={closeMenu}
                >
                  FAQ
                </Link>
                <Link
                  href="/returns"
                  className="block py-2 text-gray-700 hover:text-primary"
                  onClick={closeMenu}
                >
                  Returns & Refunds
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Categories Row with Full-Screen Hover Dropdown */}
        {isCategory && (
          <div className="hidden md:block z-40  bg-white">
            <div className="w-full flex items-center justify-center">
              <ul className="flex justify-between w-full space-x-8 py-2 relative">
                <li>
                  <Link
                    href="/category/all"
                    className="text-sm font-medium text-gray-800 hover:text-primary transition-colors"
                  >
                    All Categories
                  </Link>
                </li>
                {isLoading ? (
                  <li className="text-sm text-gray-600">Loading...</li>
                ) : (
                  categories.map((category) => (
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
                        {(category.subCategories.length > 0 || Object.keys(category.attributeValues).length > 0) && (
                          <ChevronDown size={16} className="ml-1" />
                        )}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Full-Screen Dropdown */}
            {hoveredCategory && (
              <div
                className="fixed left-0 right-0 top-26 bg-black/30 shadow-lg z-[100] "

              >
                <div onMouseEnter={() => {
                  if (dropdownTimeoutRef.current) {
                    clearTimeout(dropdownTimeoutRef.current);
                  }
                }}
                  onMouseLeave={handleMouseLeaveCategory} className="max-w-[90%] bg-white mx-auto p-6 flex flex-row gap-12 h-[calc(100vh-6rem)] overflow-y-auto">
                  {categories
                    .filter((category) => category.name === hoveredCategory)
                    .map((category) => (
                      <React.Fragment key={category.id}>
                        {/* Left: Subcategories */}
                        <div className="w-1/2">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Explore Subcategories</h3>
                          {category.subCategories.length > 0 ? (
                            <ul className="grid grid-cols-2 gap-2">
                              {category.subCategories.map((subCat) => (
                                <li key={subCat.id}>
                                  <Link
                                    href={`/category/${category.slug}/${subCat.slug}`}
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
                        </div>

                        {/* Right: Attributes */}
                        <div className="w-1/2 relative" ref={attributeRef}>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Features</h3>
                          <div className="flex flex-row gap-6">
                            <ul className="w-1/2">
                              {Object.entries(category.attributeValues)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([attrName]) => (
                                  <li
                                    key={attrName}
                                    className="py-1"
                                    onMouseEnter={() => handleMouseEnterAttribute(attrName)}
                                  >
                                    <button
                                      className="text-sm text-gray-600 hover:text-primary transition-colors capitalize"
                                      onMouseLeave={handleMouseLeaveAttribute}
                                    >
                                      {attrName.replace('_', ' ')}
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
                      </React.Fragment>
                    ))}
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