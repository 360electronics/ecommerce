"use client";

import React, { useState, useEffect, useRef } from "react";
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
import categoryData from "@/data/categories.json";

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

export const categoryFeatures: Record<string, { [feature: string]: string[] }> =
  {
    // 🧰 Laptops
    Laptops: {
      brand: ["HP", "DELL", "ASUS", "LENOVO", "ACER", "MSI"],
      Processor: [
        "Intel Core i3",
        "Intel Core i5",
        "Intel Core i7",
        "AMD Ryzen 5",
        "AMD Ryzen 7",
        "Apple M3",
      ],
      Graphics: [
        "RTX 4050",
        "RTX 4060",
        "RTX 3050",
        "RTX 3060",
        "Integrated Graphics",
        "AMD Radeon Graphics",
        "13650HX",
        "14650HX",
      ],
      Ram: ["8 GB", "16 GB", "32 GB"],
      Storage: ["512 GB SSD", "1 TB SSD", "2 TB SSD"],
      "Display Size": [
        "13 inches",
        "14 inches",
        "15.6 inches",
        "16 inches",
        "17 inches",
      ],
    },

    // ⚙️ Processors
    Processors: {
      Cpu: [
        "AMD Athlon",
        "AMD Ryzen 3",
        "AMD Ryzen 5",
        "AMD Ryzen 7",
        "AMD Ryzen 9",
        "Intel Core i3",
        "Intel Core i5",
        "Intel Core i7",
        "Intel Core i9",
        "Intel Ultra 5",
        "Intel Ultra 7",
        "Intel Ultra 9",
      ],
      Series: [
        "AMD 3000 Series",
        "AMD 4000 Series",
        "AMD 5000 Series",
        "AMD 7000 Series",
        "AMD 8000 Series",
        "AMD 9000 Series",
        "Intel 10th Gen",
        "Intel 11th Gen",
        "Intel 12th Gen",
        "Intel 13th Gen",
        "Intel 14th Gen",
      ],
    },

    // 🎮 Graphics Card
    "Graphics Card": {
      brand: ["Asrock", "ASUS", "Galax", "GIGABYTE", "Inno3D", "MSI"],
      Series: [
        "3000 Series",
        "3050 Series",
        "3060 Series",
        "4000 Series",
        "4060 Series",
        "5000 Series",
        "5050 Series",
        "5060 Series",
        "5070 Series",
        "5080 Series",
        "5090 Series",
        "6000 Series",
        "6500 Series",
        "9000 Series",
        "9060 Series",
        "9070 Series",
        "GT 1000 Series",
        "GT 700 Series",
        "RTX 3000 Series",
        "RTX 5000 Series",
        "RX 500 Series",
        "RX 7000 Series",
        "RX 9000 Series",
      ],
      "Memory Type": ["DDR3", "GDDR3", "GDDR5", "GDDR6", "GDDR6X", "GDDR7"],
      Chipset: ["AMD Radeon", "NVIDIA GeForce", "NVIDIA Quadro"],
    },

    // 🖥 Monitors
    Monitors: {
      Brand: ["LG", "Samsung", "ACER", "ASUS", "MSI", "BenQ"],
      "Screen Size": [
        "15.6 Inches",
        "16 Inches",
        "18.5 Inches",
        "19 Inches",
        "20 Inches",
        "21.5 Inches",
        "22 Inches",
        "23 Inches",
        "24 Inches",
        "24.5 Inches",
        "25 Inches",
        "27 Inches",
        "28 Inches",
        "29 Inches",
        "30 Inches",
        "31.5 Inches",
        "32 Inches",
        "34 Inches",
        "35 Inches",
        "38 Inches",
        "39 Inches",
        "43 Inches",
        "49 Inches",
        "52 Inches",
      ],
      Display: [
        "HD 1280x720",
        "HD+ 1600x900",
        "FHD 1920x1080",
        "FHD Ultra Wide 2560x1080",
        "QHD 2560x1440",
        "QHD Ultra Wide 3440x1440",
        "WQHD 3440x1440",
        "WQHD 3840x1600",
        "UHD 2560x1600",
        "4K UHD 3840x2160",
        "5K QHD 5120x2880",
      ],
    },
    // 🧬 Motherboard
    Motherboard: {
      brand: ["ASUS", "GIGABYTE", "MSI", "Asrock"],
      Chipset: ["Z790", "B760", "B550", "X870"],
    },

    // 🎧 Peripherals
    Peripherals: {
      brand: ["Logitech", "Razer", "Corsair", "HP", "Canon"],
      Connectivity: ["Wired", "Wireless", "Bluetooth"],
      Features: ["RGB Lighting", "Noise Cancellation", "Adjustable DPI"],
    },
  };

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
  const [expandedFeatures, setExpandedFeatures] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    // Step 1: render categories immediately
    const baseCategories = categoryData.map((cat: any) => ({
      ...cat,
      name: cat.name === "Graphics_cards" ? "Graphics Card" : cat.name,
      subCategories: cat.subcategories,
      attributes: cat.attributes,
      attributeValues: {}, // empty initially
    }));

    const allowed = new Set([
      "Laptops",
      "Processors",
      "Graphics Card",
      "Monitors",
      "Motherboard",
      "Peripherals",
    ]);

    setAllCategories(baseCategories);
    setCategories(baseCategories.filter((c) => allowed.has(c.name)));
    setHasFetched(true); // instantly visible

    // Step 2: enrich asynchronously
    (async () => {
      try {
        const products = await fetchProducts();
        const attrMap: Record<string, Record<string, Set<string>>> = {};

        products.forEach((p: any) => {
          const cid = p.categoryId;
          if (!attrMap[cid]) attrMap[cid] = {};
          p.variants.forEach((v: any) => {
            Object.entries(v.attributes).forEach(([key, value]) => {
              if (!attrMap[cid][key]) attrMap[cid][key] = new Set();
              attrMap[cid][key].add(value as string);
            });
          });
        });

        const enriched = baseCategories.map((cat) => ({
          ...cat,
          attributeValues: attrMap[cat.id]
            ? Object.fromEntries(
                Object.entries(attrMap[cat.id]).map(([k, v]) => [
                  k,
                  Array.from(v),
                ])
              )
            : {},
        }));

        setAllCategories(enriched);
        setCategories(enriched.filter((c) => allowed.has(c.name)));
      } catch (err) {
        console.error("Product enrichment failed:", err);
      }
    })();
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
                  <motion.button className="text-sm font-medium text-gray-800 hover:!text-primary cursor-pointer transition-colors flex items-center">
                    Categories
                    <ChevronDown
                      size={16}
                      className={`ml-1 transition-transform ${
                        hoveredAllCategories ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>
                  {hoveredAllCategories && (
                    <div className="fixed left-0 right-0 top-22 h-dvh bg-black/30 z-[100]">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        onMouseEnter={() => {
                          if (dropdownTimeoutRef.current)
                            clearTimeout(dropdownTimeoutRef.current);
                        }}
                        onMouseLeave={handleMouseLeaveAllCategories}
                        className="max-w-[90%] mx-auto bg-white rounded-lg shadow-xl p-8 mt-2 grid grid-cols-4 gap-8 overflow-y-auto max-h-[70vh]"
                      >
                        {allCategories.map((category) => (
                          <motion.div
                            key={category.id}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col justify-between border border-gray-100 rounded-xl hover:shadow-md hover:border-primary/20 transition-all duration-200"
                          >
                            <div className="p-4">
                              <Link
                                href={`/category/${category.slug}`}
                                className="flex items-center gap-2 mb-3 text-gray-900 hover:text-primary transition-colors"
                                onClick={() => setHoveredAllCategories(false)}
                              >
                                {getCategoryIcon(category.name)}
                                <span className="font-semibold text-base">
                                  {category.name}
                                </span>
                              </Link>

                              {category.subCategories.length > 0 ? (
                                <ul className="space-y-1">
                                  {category.subCategories
                                    .slice(0, 5)
                                    .map((subCat) => (
                                      <motion.li
                                        key={subCat.id}
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Link
                                          href={`/category/${category.slug}?subcategory=${subCat.slug}`}
                                          className="text-sm text-gray-600 hover:text-primary transition-colors block truncate"
                                          onClick={() =>
                                            setHoveredAllCategories(false)
                                          }
                                        >
                                          {subCat.name}
                                        </Link>
                                      </motion.li>
                                    ))}
                                  {category.subCategories.length > 5 && (
                                    <li>
                                      <Link
                                        href={`/category/${category.slug}`}
                                        className="text-sm text-primary font-medium hover:underline"
                                        onClick={() =>
                                          setHoveredAllCategories(false)
                                        }
                                      >
                                        View all →
                                      </Link>
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                <p className="text-gray-500 text-sm italic">
                                  No subcategories
                                </p>
                              )}
                            </div>
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
              <div className="fixed left-0 right-0 top-22 h-dvh bg-black/30  z-[100]">
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current)
                      clearTimeout(dropdownTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeaveCategory}
                  className="max-w-[95%] mx-auto bg-white rounded-lg shadow-2xl mt-2 grid grid-cols-2 gap-10 p-8 overflow-hidden border border-gray-100 "
                  style={{ maxHeight: "85dvh" }}
                >
                  {categories
                    .filter((category) => category.name === hoveredCategory)
                    .map((category) => {
                      const filterableAttributes = category.attributes.filter(
                        (a) => a.isFilterable
                      );

                      return (
                        <React.Fragment key={category.id}>
                          {/* LEFT — Subcategories */}
                          <div className="flex flex-col min-h-[50dvh] max-h-[50dvh] overflow-y-auto pr-4">
                            <div className="flex items-center gap-2 mb-5 sticky top-0 bg-white pb-2 border-b border-gray-100 z-10">
                              {getCategoryIcon(category.name)}
                              <h3 className="text-lg font-semibold text-gray-800">
                                {category.name}
                              </h3>
                            </div>

                            {category.subCategories.length > 0 ? (
                              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {category.subCategories.map((subCat) => (
                                  <motion.li
                                    key={subCat.id}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Link
                                      href={`/category/${category.slug}?subcategory=${subCat.slug}`}
                                      onClick={() => setHoveredCategory(null)}
                                      className="block text-sm text-gray-700 hover:text-primary px-2 py-1.5 rounded-md hover:bg-primary/5 transition-colors font-medium"
                                    >
                                      {subCat.name}
                                    </Link>
                                  </motion.li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-sm italic mt-4">
                                No subcategories available
                              </p>
                            )}
                          </div>

                          {/* RIGHT — Filter by Features */}
                          <div className="min-h-[50dvh] max-h-[50dvh] overflow-y-auto">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 sticky top-0 bg-white pb-2 border-b border-gray-100 z-10">
                              <Package size={20} className="text-primary" />
                              Filter by Features
                            </h3>

                            {categoryFeatures[category.name] ? (
                              <div className="flex flex-col gap-6">
                                {Object.entries(
                                  categoryFeatures[category.name]
                                ).map(([feature, values]) => (
                                  <div key={feature}>
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-sm font-medium text-gray-700 capitalize">
                                        {feature}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {(expandedFeatures[feature]
                                        ? values
                                        : values.slice(0, 6)
                                      ).map((value) => (
                                        <Link
                                          key={value}
                                          href={`/category/${
                                            category.slug
                                          }?${encodeURIComponent(
                                            feature
                                          )}=${encodeURIComponent(value)}`}
                                          onClick={() =>
                                            setHoveredCategory(null)
                                          }
                                          className="text-xs bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-700 px-2 py-1 rounded-md border border-gray-200 hover:border-primary/30 transition-colors"
                                        >
                                          {value}
                                        </Link>
                                      ))}
                                      {values.length > 6 && (
                                        <button
                                          onClick={() =>
                                            setExpandedFeatures((prev) => ({
                                              ...prev,
                                              [feature]: !prev[feature],
                                            }))
                                          }
                                          className="text-xs text-primary ml-2 hover:underline focus:outline-none"
                                        >
                                          {expandedFeatures[feature]
                                            ? "Show less"
                                            : "View more"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm italic mt-2">
                                No filterable features available
                              </p>
                            )}
                          </div>
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
