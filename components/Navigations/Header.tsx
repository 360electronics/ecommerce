"use client";

import React, { useState, useEffect, useRef } from "react";
import LocationPicker from "./Header/LocationPicker";
import SearchBar from "./Header/Search/SearchBar";
import WishlistButton from "./Header/WishlistButton";
import UserButton from "./Header/UserButton";
import CartButton from "./Header/CartButton";
import { usePathname, useRouter } from "next/navigation";
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
      brand: ["HP", "DELL", "ASUS", "LENOVO", "ACER", "MSI", "GIGABYTE"],
      Processor: [
        "Intel Core i3",
        "Intel Core i5",
        "Intel Core i7",
        "Core Ultra 5",
        "Core Ultra 7",
        "Core Ultra 9",
        "AMD Ryzen 3",
        "AMD Ryzen 5",
        "AMD Ryzen 7",
      ],
      Graphics: [
        "RTX 2050",
        "RTX 3050",
        "RTX 4050",
        "RTX 5050",
        "RTX 4060",
        "RTX 5060",
      ],
      Ram: ["8 GB", "16 GB", "32 GB"],
      Storage: ["512 GB", "1 TB", "2 TB"],
      "Display Size": [
        "13.3 inch",
        "13.6 inch",
        "14 inch",
        "14.2 inch",
        "15 inches",
      ],
    },

    // ⚙️ Processors
    Processors: {
      Cpu: [
        "Ryzen 3",
        "Ryzen 5",
        "Ryzen 7",
        "Ryzen 9",
        "Intel i3",
        "Intel i5",
        "Intel i7",
        "Intel i9",
        "Intel Ultra 5",
        "Intel Ultra 7",
        "Intel Ultra 9",
      ],
      Series: [
        "AMD 3000 Series",
        "AMD 5000 Series",
        "AMD 7000 Series",
        "AMD 8000 Series",
        "AMD 9000 Series",
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
        "RTX 3000 Series",
        "RTX 4000 Series",
        "RTX 5000 Series",
        "RX 7000 Series",
        "RX 9000 Series",
      ],
      "Memory Type": ["GDDR3", "GDDR5", "GDDR6", "GDDR7"],
      Chipset: ["AMD Radeon", "NVIDIA GeForce"],
    },

    // 🖥 Monitors
    Monitors: {
      brand: ["LG", "Samsung", "ACER", "ASUS", "MSI", "BenQ", "Dell", "Lenovo", "Viewsonic", "Zebronics"],
      "Screen Size": [
        "19 Inch",
        "22 Inch",
        "24 Inch",
        "27 Inch",
        "32 Inch",
        "34 Inch",
      ],
      Display: ["HD", "QHD", "UHD", "FHD"],
    },
    // 🧬 Motherboard
    Motherboard: {
      brand: ["ASUS", "GIGABYTE", "MSI", "Asrock"],
      Chipset: [
        "A520",
        "B450",
        "B550",
        "B650",
        "X870",
        "Z790",
        "B760",
        "H610",
        "Z890",
      ],
      Platform: ["AMD", "INTEL"],
    },

    // 🎧 Peripherals
    Peripherals: {
      brand: ["Logitech", "Razer", "Corsair", "HP", "Canon"],
      Connectivity: ["Wired", "Wireless", "Bluetooth"],
      Features: ["RGB Lighting", "Noise Cancellation", "Adjustable DPI"],
    },

    // 🖨️ Printer
    Printer: {
      brand: ["HP", "EPSON", "CANON", "BROTHER"],
    },

    // // ❄️ CPU Cooler
    // "CPU Cooler": {
    //   Type: ["Air Cooler", "Liquid Cooler", "AIO Liquid Cooler"],
    //   Brand: ["Noctua", "Corsair", "Cooler Master", "NZXT", "Arctic"],
    //   Socket: ["AM4", "AM5", "LGA 1700", "LGA 1200", "LGA 1151"],
    // },

    // 💾 RAM
    RAM: {
      "Memory Type": ["DDR4", "DDR5"],
      Capacity: ["8 GB", "16 GB", "32 GB", "64 GB", "128 GB"],
      Speed: ["3200 MHz", "3600 MHz", "6000 MHz", "7200 MHz"],
    },

    // 💿 Storage
    Storage: {
      Category: ["SDD", "External SSD", "NVMe", "SSD"],
      Capacity: ["256GB", "512GB", "1TB", "2TB", "4TB", "8TB"],
    },

    // 🔌 Power Supply
    "Power Supply": {
      Wattage: [
        "500 Watt",
        "650 Watt",
        "750 Watt",
        "850 Watt",
        "1000 Watt",
        "1200 Watt",
      ],
      Certification: [
        "80 PLUS BRONZE",
        "80 Plus Gold",
        "80 Plus Platinum",
        "80 Plus Titanium",
      ],
      Modular: [
        "Non Modular",
        "Semi Modular",
        "Fully Modular",
        "80 Plus Platinum",
      ],
    },

    // 🗄️ Cabinets
    Cabinets: {
      "Cabinet Size": ["Mid Tower", "Full Tower", "Mini Tower"],
      brand: ["MSI", "FRACTAL DESIGN", "NZXT", "COOLER MASTER", "LIAN LI"],
    },

    // ⌨️ Keyboard and Mouse
    "Keyboard and Mouse": {
      brand: [
        "ACER",
        "ANT ESPORTS",
        "ASUS",
        "COOLER MASTER",
        "HyperX",
        "Logitech",
        "RAZER",
      ],
    },

    // 🎧 Headset
    Headset: {
      brand: [
        "Adata",
        "ANT ESPORTS",
        "Boat",
        "Cosmic Byte",
        "HyperX",
        "Logitech",
        "Dawg",
        "RAPOO",
        "RAZER",
      ],
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
  const pathname = usePathname();

  useEffect(() => {
    // Step 1: render categories immediately
    const baseCategories = categoryData.map((cat: any) => ({
      ...cat,
      name: cat.name === "Graphics_cards" ? "Graphics Card" : cat.name,
      subCategories: cat.subcategories,
      attributes: cat.attributes,
      attributeValues: {}, // empty initially
    }));

    const orderMap: Record<string, number> = {
      Laptops: 0,
      Processors: 1,
      "Graphics Card": 2,
      Monitors: 3,
      Printer: 4,
      Motherboard: 5,
      "CPU Cooler": 6,
      RAM: 7,
      Storage: 8,
      "Power Supply": 9,
      Cabinets: 10,
      "Keyboard and Mouse": 11,
      Headset: 12,
      Peripherals: 13,
    };

    const sortedAllCategories = [...baseCategories].sort((a, b) => {
      const aOrder = orderMap[a.name] ?? 99;
      const bOrder = orderMap[b.name] ?? 99;
      return aOrder - bOrder;
    });

    const allowed = new Set([
      "Laptops",
      "Processors",
      "Graphics Card",
      "Monitors",
      "Printer",
      "Motherboard",
    ]);

    const sortedCategories = sortedAllCategories.filter((c) =>
      allowed.has(c.name)
    );

    setAllCategories(sortedAllCategories);
    setCategories(sortedCategories);
    setHasFetched(true);
  }, []);

  useEffect(() => {
    // Close all dropdowns when route changes
    setHoveredCategory(null);
    setHoveredAllCategories(false);
    setExpandedFeatures({});
    setExpandedFeature(null);
  }, [pathname]);

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
                src="/logo/360_logo.PNG"
                alt="Computer 360 Logo"
                width={150}
                height={150}
                className="h-auto w-[60px] md:w-[70px]"
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center flex-grow">
            <LocationPicker />
            <div className="flex-grow mx-4">
              <SearchBar />
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
            <SearchBar />
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
              className="fixed inset-y-0 left-0 z-100 lg:hidden bg-white overflow-hidden"
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
                            (subCat, idx) => (
                              <motion.div
                                key={idx}
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
                    {(() => {
                      // dynamic attribute values or fallback to static categoryFeatures
                      const dynamicAttrs =
                        selectedMobileCategory.attributes.filter(
                          (a) =>
                            a.isFilterable === true &&
                            selectedMobileCategory.attributeValues[a.name!]
                              ?.length > 0
                        );

                      const staticFeatures =
                        categoryFeatures[selectedMobileCategory.name] || {};

                      const showFallback =
                        dynamicAttrs.length === 0 &&
                        Object.keys(staticFeatures).length > 0;

                      return (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            Filter by Features
                          </h4>

                          <div className="space-y-2">
                            {showFallback
                              ? Object.entries(staticFeatures).map(
                                  ([feature, values]) => (
                                    <div key={feature}>
                                      <button
                                        onClick={() =>
                                          setExpandedFeature(
                                            expandedFeature === feature
                                              ? null
                                              : feature
                                          )
                                        }
                                        className="w-full flex items-center justify-between py-3 px-3 text-sm text-gray-700 hover:text-primary bg-gray-50 hover:bg-primary/5 rounded-lg transition-all group font-medium"
                                      >
                                        <span>{feature}</span>
                                        <ChevronDown
                                          size={16}
                                          className={`text-primary transition-transform ${
                                            expandedFeature === feature
                                              ? "rotate-180"
                                              : ""
                                          }`}
                                        />
                                      </button>

                                      <AnimatePresence>
                                        {expandedFeature === feature && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                              opacity: 1,
                                              height: "auto",
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden mt-2 ml-2 border-l-2 border-primary/30 pl-3 space-y-2"
                                          >
                                            {values.map((value) => (
                                              <Link
                                                key={value}
                                                href={`/category/${
                                                  selectedMobileCategory.slug
                                                }?${encodeURIComponent(
                                                  feature
                                                )}=${encodeURIComponent(
                                                  value
                                                )}`}
                                                onClick={closeMenu}
                                                className="flex items-center justify-between py-2 px-3 text-xs text-gray-600 hover:text-primary hover:bg-primary/5 rounded transition-all group"
                                              >
                                                <span>{value}</span>
                                                <ArrowUpRight
                                                  size={14}
                                                  className="text-primary opacity-0 group-hover:opacity-100"
                                                />
                                              </Link>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )
                                )
                              : dynamicAttrs.map((attr) => {
                                  const isExpanded =
                                    expandedFeature === attr.name;
                                  const values =
                                    selectedMobileCategory.attributeValues[
                                      attr.name!
                                    ] || [];
                                  return (
                                    <div key={attr.name}>
                                      <button
                                        onClick={() =>
                                          setExpandedFeature(
                                            isExpanded ? null : attr.name
                                          )
                                        }
                                        className="w-full flex items-center justify-between py-3 px-3 text-sm text-gray-700 hover:text-primary bg-gray-50 hover:bg-primary/5 rounded-lg transition-all group font-medium"
                                      >
                                        <span>
                                          {attr.name?.replace("_", " ")}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`text-primary transition-transform ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                              opacity: 1,
                                              height: "auto",
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden mt-2 ml-2 border-l-2 border-primary/30 pl-3 space-y-2"
                                          >
                                            {values.map((value) => (
                                              <Link
                                                key={value}
                                                href={`/category/${
                                                  selectedMobileCategory.slug
                                                }?${
                                                  attr.name
                                                }=${encodeURIComponent(value).toLocaleLowerCase()}`}
                                                onClick={closeMenu}
                                                className="flex items-center justify-between py-2 px-3 text-xs text-gray-600 hover:text-primary hover:bg-primary/5 rounded transition-all group"
                                              >
                                                <span>{value}</span>
                                                <ArrowUpRight
                                                  size={14}
                                                  className="text-primary opacity-0 group-hover:opacity-100"
                                                />
                                              </Link>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                          </div>
                        </div>
                      );
                    })()}
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
                    <div className="fixed left-0 right-0 top-24 h-dvh bg-black/30 z-[100]">
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
                        {allCategories.map((category, idx) => (
                          <motion.div
                            key={idx}
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
                                    .map((subCat, idx) => (
                                      <motion.li
                                        key={idx}
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
              <div className="fixed left-0 right-0 top-24 h-dvh bg-black/30  z-[100]">
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
                    .map((category, idx) => {
                      const filterableAttributes = category.attributes.filter(
                        (a) => a.isFilterable
                      );

                      return (
                        <React.Fragment key={idx}>
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
                                {category.subCategories.map((subCat, idx) => (
                                  <motion.li
                                    key={idx}
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
                                          )}=${encodeURIComponent(value).toLocaleLowerCase()}`}
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
