"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import LocationPicker from "./Header/LocationPicker";
import SearchBar from "./Header/Search/SearchBar";
import WishlistButton from "./Header/WishlistButton";
import UserButton from "./Header/UserButton";
import CartButton from "./Header/CartButton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Building,
  ArrowUpRight,
  Laptop,
  Cpu,
  Monitor,
  Keyboard,
  Smartphone,
  Package,
  ArrowLeft,
  Home,
} from "lucide-react";
import { TbPlug as Power } from "react-icons/tb";
import { LuWebcam as Webcam } from "react-icons/lu";
import { BiCabinet as Cabinet } from "react-icons/bi";
import { FaFan as Cooler } from "react-icons/fa";
import { MdMemory as RAM } from "react-icons/md";
import { IoMdPrint as Printer } from "react-icons/io";
import { IoHeadset as Headset } from "react-icons/io5";
import { PiGraphicsCard as GraphicsCard } from "react-icons/pi";
import { BsMotherboard as Motherboard } from "react-icons/bs";

import { motion, AnimatePresence } from "framer-motion";
import { fetchProducts } from "@/utils/products.util";

interface HeaderProps {
  isCategory?: boolean;
}

interface Attribute {
  name: string | null;
  type: "text" | "number" | "boolean" | "select" | null;
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

const CACHE_KEY = "header_data_cache";
const CACHE_DURATION = 1000 * 60 * 60;

const getCategoryIcon = (categoryName: string) => {
  const iconProps = { size: 20, className: "text-primary size-5 md:size-6" };
  const iconMap: { [key: string]: React.ReactNode } = {
    Laptops: <Laptop {...iconProps} />,
    Processors: <Cpu {...iconProps} />,
    "Graphics Card": <GraphicsCard {...iconProps} />,
    Monitors: <Monitor {...iconProps} />,
    Peripherals: <Webcam {...iconProps} />,
    Motherboard: <Motherboard {...iconProps} />,
    "Power Supply": <Power {...iconProps} />,
    "Keyboard and Mouse": <Keyboard {...iconProps} />,
    Cabinets: <Cabinet {...iconProps} />,
    "CPU Cooler": <Cooler {...iconProps} />,
    RAM: <RAM {...iconProps} />,
    Printer: <Printer {...iconProps} />,
    Headset: <Headset {...iconProps} />,
  };
  return iconMap[categoryName] || <Package {...iconProps} />;
};

const Header = ({ isCategory = true }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredAttribute, setHoveredAttribute] = useState<string | null>(null);
  const [hoveredAllCategories, setHoveredAllCategories] = useState(false);
  const [selectedMobileCategory, setSelectedMobileCategory] =
    useState<Category | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attributeRef = useRef<HTMLDivElement>(null);

  const allowedCategories = new Set([
    "Laptops",
    "Processors",
    "Graphics Card",
    "Monitors",
    "Motherboard",
    "Peripherals",
  ]);

  const categoryImages: Record<string, string> = {
    Laptops: "/header/categories/storage.jpg",
    Processors: "/header/categories/processor.jpg",
    "Graphics Card": "/header/categories/graphics-card.jpg",
    Monitors: "/header/categories/monitors.jpg",
    Accessories: "/header/categories/accessories.jpg",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories first for instant display
        const categoryResponse = await fetch("/api/categories");
        if (!categoryResponse.ok) throw new Error("Failed to fetch categories");

        const categoryData = await categoryResponse.json();

        const normalizeValue = (val: string) => {
          if (!val) return "";
          let v = val.trim().replace(/\s+/g, " ").toLowerCase();
          let brand = "";

          if (/\bamd\b/i.test(v)) brand = "AMD";
          else if (/\bintel\b/i.test(v)) brand = "Intel";
          else if (/\bnvidia\b/i.test(v)) brand = "NVIDIA";
          else if (/\bmsi\b/i.test(v)) brand = "MSI";
          else if (/\basus\b/i.test(v)) brand = "Asus";

          if (brand) {
            const brandRegex = new RegExp(`\\b(${brand})\\b`, "ig");
            v = v.replace(brandRegex, "").trim();
          }

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

          if (/tuf\s+gaming/i.test(v)) {
            if (!brand) brand = "Asus";
            v = v.replace(/tuf\s+gaming/i, "TUF Gaming");
          }
          if (/rog\s+/i.test(v)) {
            if (!brand) brand = "Asus";
            v = v.replace(/rog\s+/i, "ROG ");
          }

          v = v.replace(/(\d+)\s*(gb|ssd|hdd)/i, "$1 GB");
          v = v.replace(/(\d+)(gb|ssd|hdd)/i, "$1 GB");
          v = v.replace(
            /(\d+(\.\d+)?)\s*cm\s*\((\d+(\.\d+)?)\s*inch\)/i,
            "$3 inch"
          );
          v = v.replace(/\b(\w+)( \1\b)+/gi, "$1");
          v = v.replace(/\b\w/g, (c) => c.toUpperCase());

          if (brand && !v.startsWith(brand)) {
            v = `${brand} ${v}`;
          }

          return v.trim();
        };

        // Set partial data immediately (without attribute values)
        const allTemp: Category[] = Object.values(categoryData)
          .map(({ category, attributes, subcategories }: any) => ({
            ...category,
            name:
              category.name === "Graphics_cards"
                ? "Graphics Card"
                : category.name,
            attributes,
            subCategories: subcategories,
            attributeValues: {}, // Empty initially
          }))
          .sort((a, b) => parseInt(a.displayOrder) - parseInt(b.displayOrder));

        const categoryList = allTemp.filter(({ name }) =>
          allowedCategories.has(name)
        );

        setCategories(categoryList);
        setAllCategories(allTemp);
        setHasFetched(true);

        // Now fetch products and compute attribute values asynchronously
        const productResponse = await fetchProducts();
        const productData = productResponse || [];

        const attributeValuesMap: Record<
          string,
          Record<string, Set<string>>
        > = {};
        productData.forEach((product: Product) => {
          const categoryId = product.categoryId;
          if (!attributeValuesMap[categoryId]) {
            attributeValuesMap[categoryId] = {};
          }
          product.variants.forEach((variant) => {
            Object.entries(variant.attributes).forEach(([key, value]) => {
              if (!attributeValuesMap[categoryId][key]) {
                attributeValuesMap[categoryId][key] = new Set();
              }
              attributeValuesMap[categoryId][key].add(
                normalizeValue(value as string)
              );
            });
          });
        });

        // Update states with attribute values
        const updatedAllTemp = allTemp.map((cat) => ({
          ...cat,
          attributeValues: attributeValuesMap[cat.id]
            ? Object.fromEntries(
                Object.entries(attributeValuesMap[cat.id]).map(
                  ([key, valueSet]) => [key, Array.from(valueSet).sort()]
                )
              )
            : {},
        }));

        const updatedCategoryList = updatedAllTemp.filter(({ name }) =>
          allowedCategories.has(name)
        );

        setAllCategories(updatedAllTemp);
        setCategories(updatedCategoryList);

        // Cache the full data
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              categories: updatedCategoryList,
              allCategories: updatedAllTemp,
              timestamp: Date.now(),
            })
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setHasFetched(true);
      }
    };

    if (typeof window !== "undefined") {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const {
            categories: cachedCategories,
            allCategories: cachedAllCategories,
            timestamp,
          } = parsed || {};
          const now = Date.now();
          if (
            now - timestamp < CACHE_DURATION &&
            Array.isArray(cachedCategories) &&
            Array.isArray(cachedAllCategories)
          ) {
            setCategories(cachedCategories);
            setAllCategories(cachedAllCategories);
            setHasFetched(true);
            return;
          }
        } catch (e) {
          console.error("Cache parse error:", e);
          sessionStorage.removeItem(CACHE_KEY);
        }
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        isMenuOpen &&
        !selectedMobileCategory
      ) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, selectedMobileCategory]);

  const handleSearch = (
    query: string | number | boolean,
    category: string | number | boolean
  ) => {
    router.push(
      `/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(
        category
      )}`
    );
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
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setSelectedMobileCategory(null);
    setExpandedFeature(null);
    document.body.style.overflow = "auto";
  };

  const handleMouseEnterCategory = (categoryName: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredCategory(
      categoryName === "Graphics_cards" ? "Graphics Card" : categoryName
    );
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
    if (
      attributeRef.current &&
      !attributeRef.current.contains(event.relatedTarget as Node)
    ) {
      setHoveredAttribute(null);
    }
  };

  return (
    <>
      <header
        className={`w-full bg-white pt-3 px-4 md:px-12 fixed top-0 left-0 z-50 transition-all duration-300 ${
          isScrolled ? "shadow-md" : ""
        }`}
      >
        <div className="mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center">
            <button
              className="mr-2 lg:hidden focus:outline-none hover:bg-gray-100 p-2 rounded-lg transition-colors"
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

          <div className="px-2">
            <Link
              href={"/store-locator"}
              className="hidden md:flex items-center gap-2 font-medium text-sm hover:text-primary transition-colors group"
            >
              <span className="text-primary group-hover:scale-110 transition-transform">
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
            <WishlistButton />
            <UserButton />
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

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-0 z-40 lg:hidden"
              onClick={() => !selectedMobileCategory && closeMenu()}
            >
              <div className="absolute inset-0 bg-black/40" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu - Slide from Left */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden bg-white overflow-hidden"
              style={{ width: "80vw", maxWidth: "320px", height: "100dvh" }}
              ref={menuRef}
            >
              {selectedMobileCategory ? (
                // Category Details View
                <motion.div
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-4 flex flex-col h-full"
                >
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1, x: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setExpandedFeature(null);
                          setSelectedMobileCategory(null);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ArrowLeft size={24} className="text-primary" />
                      </motion.button>
                      <motion.h3
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="font-bold text-lg"
                      >
                        {selectedMobileCategory.name}
                      </motion.h3>
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-4">
                    {/* Subcategories */}
                    {selectedMobileCategory.subCategories.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Smartphone size={16} className="text-primary" />
                          Subcategories
                        </h4>
                        <div className="space-y-2">
                          {selectedMobileCategory.subCategories.map(
                            (subCat) => (
                              <motion.div
                                key={subCat.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Link
                                  href={`/category/${selectedMobileCategory.slug}?subcategory=${subCat.slug}`}
                                  className="flex items-center justify-between py-3 px-3 text-sm text-gray-700 hover:text-primary bg-gray-50 hover:bg-primary/5 rounded-lg transition-all group font-medium"
                                  onClick={closeMenu}
                                >
                                  <span>{subCat.name}</span>
                                  <motion.div
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ArrowUpRight
                                      size={16}
                                      className="text-primary opacity-60 group-hover:opacity-100"
                                    />
                                  </motion.div>
                                </Link>
                              </motion.div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Filterable Attributes */}
                    {selectedMobileCategory.attributes.filter(
                      (a) => a.isFilterable
                    ).length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Package size={16} className="text-primary" />
                          Filter by Features
                        </h4>
                        <div className="space-y-2">
                          {selectedMobileCategory.attributes
                            .filter(
                              (attr) =>
                                attr.isFilterable === true &&
                                selectedMobileCategory.attributeValues[
                                  attr.name!
                                ]?.length > 0
                            )
                            .sort((a, b) =>
                              (a.name || "").localeCompare(b.name || "")
                            )
                            .map((attr) => {
                              const isExpanded = expandedFeature === attr.name;
                              const values =
                                selectedMobileCategory.attributeValues[
                                  attr.name!
                                ] || [];

                              return (
                                <div key={attr.name}>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() =>
                                      setExpandedFeature(
                                        isExpanded ? null : attr.name
                                      )
                                    }
                                    className="w-full flex items-center justify-between py-3 px-3 text-sm text-gray-700 hover:text-primary bg-gray-50 hover:bg-primary/5 rounded-lg transition-all group font-medium"
                                  >
                                    <span>{attr.name?.replace("_", " ")}</span>
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <ChevronDown
                                        size={16}
                                        className="text-primary"
                                      />
                                    </motion.div>
                                  </motion.button>

                                  {/* Expanded Feature Values */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          height: 0,
                                          x: 20,
                                        }}
                                        animate={{
                                          opacity: 1,
                                          height: "auto",
                                          x: 0,
                                        }}
                                        exit={{ opacity: 0, height: 0, x: 20 }}
                                        transition={{
                                          duration: 0.3,
                                          ease: "easeInOut",
                                        }}
                                        className="overflow-hidden mt-2 ml-2 border-l-2 border-primary/30 pl-3 space-y-2"
                                      >
                                        {values.map((value) => (
                                          <motion.div
                                            key={value}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            <Link
                                              href={`/category/${
                                                selectedMobileCategory.slug
                                              }?${
                                                attr.name
                                              }=${encodeURIComponent(value)}`}
                                              className="flex items-center justify-between py-2 px-3 text-xs text-gray-600 hover:text-primary hover:bg-primary/5 rounded transition-all group"
                                              onClick={closeMenu}
                                            >
                                              <span>{value}</span>
                                              <motion.div
                                                initial={{ x: 0 }}
                                                whileHover={{ x: 4 }}
                                                transition={{ duration: 0.2 }}
                                              >
                                                <ArrowUpRight
                                                  size={14}
                                                  className="text-primary opacity-0 group-hover:opacity-100"
                                                />
                                              </motion.div>
                                            </Link>
                                          </motion.div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                // Main Categories View
                <motion.div
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-4 flex flex-col h-full"
                >
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Menu size={20} /> Menu
                    </h3>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeMenu}
                      aria-label="Close menu"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* All Categories */}
                  <div className="flex-grow overflow-y-auto space-y-2">
                    {hasFetched && allCategories.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">
                        No categories available
                      </p>
                    ) : (
                      allCategories.map((category) => {
                        const filterableAttributes = category.attributes.filter(
                          (attr) => attr.isFilterable === true
                        );
                        const hasSubsOrFilters =
                          category.subCategories.length > 0 ||
                          filterableAttributes.length > 0;

                        return (
                          <motion.div
                            key={category.id}
                            whileHover={{
                              backgroundColor: "rgba(0, 0, 0, 0.02)",
                            }}
                            transition={{ duration: 0.2 }}
                            className="rounded-lg overflow-hidden"
                          >
                            <div className="flex items-center justify-between">
                              <Link
                                href={`/category/${category.slug}`}
                                className="flex-grow py-3 px-3 text-gray-800 hover:text-primary font-semibold text-sm flex items-center gap-2 transition-colors"
                                onClick={closeMenu}
                              >
                                {getCategoryIcon(category.name)}
                                {category.name}
                              </Link>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95, rotate: 180 }}
                                onClick={() =>
                                  setSelectedMobileCategory(category)
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <ChevronDown
                                  size={18}
                                  className="text-primary transition-transform"
                                />
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Store Locator & Footer */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href="/store-locator"
                        className="flex items-center gap-3 font-semibold text-sm text-gray-800 hover:text-primary py-3 px-3 rounded-lg hover:bg-primary/5 transition-all"
                        onClick={closeMenu}
                      >
                        <Building size={18} />
                        Store Locator
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href="/contact"
                        className="flex items-center gap-3 font-semibold text-sm text-gray-800 hover:text-primary py-3 px-3 rounded-lg hover:bg-primary/5 transition-all"
                        onClick={closeMenu}
                      >
                        <Package size={18} />
                        Contact Us
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Categories Row */}
        {isCategory && (
          <div className="hidden md:block z-40 bg-white">
            <div className="w-full flex items-center justify-center">
              <ul className="flex justify-between w-full space-x-8 py-2 relative">
                <li
                  className="relative"
                  onMouseEnter={handleMouseEnterAllCategories}
                  onMouseLeave={handleMouseLeaveAllCategories}
                >
                  <motion.button
                    whileHover={{ color: "#3b82f6" }}
                    className="text-sm font-medium text-gray-800 transition-colors flex items-center"
                  >
                    Categories
                    <ChevronDown
                      size={16}
                      className={`ml-1 transition-transform ${
                        hoveredAllCategories ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>
                  {hoveredAllCategories && (
                    <div className="fixed left-0 right-0 top-22 bg-black/30 shadow-lg z-[100]">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
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
                            <motion.div
                              key={category.id}
                              whileHover={{ y: -4 }}
                              transition={{ duration: 0.2 }}
                              className="w-full"
                            >
                              <Link
                                href={`/category/${category.slug}`}
                                className="text-lg font-medium text-gray-800 mb-3 capitalize flex items-center gap-2 hover:text-primary transition-colors group"
                              >
                                {getCategoryIcon(category.name)}
                                {category.name}
                                <ArrowUpRight
                                  size={16}
                                  className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              </Link>
                              {category.subCategories.length > 0 ? (
                                <ul className="space-y-2">
                                  {category.subCategories.map((subCat) => (
                                    <motion.li
                                      key={subCat.id}
                                      whileHover={{ x: 4 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Link
                                        href={`/category/${category.slug}?subcategory=${subCat.slug}`}
                                        className="block text-sm text-gray-600 hover:text-primary py-1 transition-colors"
                                        onClick={() =>
                                          setHoveredAllCategories(false)
                                        }
                                      >
                                        {subCat.name}
                                      </Link>
                                    </motion.li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No subcategories available
                                </p>
                              )}
                            </motion.div>
                          ))}
                      </motion.div>
                    </div>
                  )}
                </li>
                {hasFetched && categories.length === 0
                  ? null
                  : categories.map((category) => {
                      const hasFilterableAttributes = category.attributes.some(
                        (attr) => attr.isFilterable === true
                      );
                      return (
                        <motion.li
                          key={category.id}
                          className="relative"
                          onMouseEnter={() =>
                            handleMouseEnterCategory(category.name)
                          }
                          onMouseLeave={handleMouseLeaveCategory}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Link
                            href={`/category/${category.slug}`}
                            className="text-sm font-medium text-gray-800 hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {category.name}
                            {(category.subCategories.length > 0 ||
                              hasFilterableAttributes) && (
                              <ChevronDown size={16} className="ml-1" />
                            )}
                          </Link>
                        </motion.li>
                      );
                    })}
              </ul>
            </div>

            {/* Full-Screen Dropdown for Individual Categories */}
            {hoveredCategory && (
              <div className="fixed left-0 right-0 top-22 bg-black/30 shadow-lg z-[100]">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) {
                      clearTimeout(dropdownTimeoutRef.current);
                    }
                  }}
                  onMouseLeave={handleMouseLeaveCategory}
                  className="max-w-[90%] bg-white mx-auto p-6 flex flex-row gap-12 h-[calc(100vh-6rem)] overflow-y-auto"
                >
                  {categories
                    .filter((category) => category.name === hoveredCategory)
                    .map((category) => {
                      const filterableAttributes = category.attributes.filter(
                        (attr) => attr.isFilterable === true
                      );
                      return (
                        <React.Fragment key={category.id}>
                          {/* Left: Subcategories */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-1/2"
                          >
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              {getCategoryIcon(category.name)}
                              Explore Subcategories
                            </h3>
                            {category.subCategories.length > 0 ? (
                              <ul className="grid grid-cols-2 gap-2">
                                {category.subCategories.map((subCat) => (
                                  <motion.li
                                    key={subCat.id}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Link
                                      href={`/category/${category.slug}?subcategory=${subCat.slug}`}
                                      className="block text-sm text-gray-600 hover:text-primary py-2 px-2 rounded hover:bg-primary/5 transition-all"
                                      onClick={() => setHoveredCategory(null)}
                                    >
                                      {subCat.name}
                                    </Link>
                                  </motion.li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">
                                No subcategories available
                              </p>
                            )}

                            {/* Category Image */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                              className="absolute bottom-10 w-full max-w-md"
                            >
                              {categoryImages[category.name] && (
                                <img
                                  src={categoryImages[category.name]}
                                  alt={category.name}
                                  width={500}
                                  height={300}
                                  className="object-cover aspect-video rounded-lg shadow-lg"
                                />
                              )}
                            </motion.div>
                          </motion.div>

                          {/* Right: Attributes */}
                          {filterableAttributes.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                              className="w-1/2 relative"
                              ref={attributeRef}
                            >
                              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Package size={20} className="text-primary" />
                                Filter by Features
                              </h3>
                              <div className="flex flex-row gap-6">
                                <ul className="w-1/2 space-y-1">
                                  {filterableAttributes
                                    .filter(
                                      (attr) =>
                                        category.attributeValues[attr.name!]
                                    )
                                    .sort((a, b) =>
                                      (a.name || "").localeCompare(b.name || "")
                                    )
                                    .map((attr) => (
                                      <motion.li
                                        key={attr.name}
                                        className="py-1"
                                        onMouseEnter={() =>
                                          handleMouseEnterAttribute(attr.name!)
                                        }
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <button
                                          className="text-sm cursor-pointer text-gray-600 hover:text-primary transition-colors capitalize rounded px-2 py-1 hover:bg-primary/5"
                                          onMouseLeave={
                                            handleMouseLeaveAttribute
                                          }
                                        >
                                          {attr.name?.replace("_", " ")}
                                        </button>
                                      </motion.li>
                                    ))}
                                </ul>
                                {hoveredAttribute && (
                                  <motion.ul
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-1/2 space-y-1"
                                  >
                                    {category.attributeValues[
                                      hoveredAttribute
                                    ]?.map((value) => (
                                      <motion.li
                                        key={value}
                                        className="py-1"
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Link
                                          href={`/category/${
                                            category.slug
                                          }?${hoveredAttribute}=${encodeURIComponent(
                                            value
                                          )}`}
                                          className="block text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer rounded px-2 py-1 hover:bg-primary/5"
                                          onClick={() =>
                                            setHoveredCategory(null)
                                          }
                                        >
                                          {value}
                                        </Link>
                                      </motion.li>
                                    ))}
                                  </motion.ul>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </React.Fragment>
                      );
                    })}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
