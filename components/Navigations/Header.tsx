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
    isCategory?: boolean
}

interface SubCategory {
    name: string;
    slug: string;
    subSubCategories?: { name: string; slug: string }[];
}

interface Category {
    name: string;
    slug: string;
    subCategories: SubCategory[];
}

const Header = ({ isCategory = true }: HeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    // Sample category data structure (you'd typically fetch this from your database)
    const categories: Category[] = [
        {
            name: 'Processor',
            slug: 'processor',
            subCategories: [
                {
                    name: 'AMD',
                    slug: 'amd',
                    subSubCategories: [
                        { name: 'Ryzen 3', slug: 'ryzen-3' },
                        { name: 'Ryzen 5', slug: 'ryzen-5' },
                    ],
                },
                {
                    name: 'Intel',
                    slug: 'intel',
                    subSubCategories: [
                        { name: 'Core i3', slug: 'core-i3' },
                        { name: 'Core i5', slug: 'core-i5' },
                    ],
                },
            ],
        },
        {
            name: 'Graphics Card',
            slug: 'graphics-card',
            subCategories: [
                {
                    name: 'AMD GPU',
                    slug: 'amd-gpu',
                    subSubCategories: [
                        { name: 'RX 9000 Series', slug: 'rx-9000-series' },
                    ],
                },
                {
                    name: 'NVIDIA GPU',
                    slug: 'nvidia-gpu',
                    subSubCategories: [
                        { name: 'RTX 50 Series', slug: 'rtx-50-series' },
                    ],
                },
            ],
        },
        // Add other categories as needed
        { name: 'Laptops', slug: 'laptops', subCategories: [] },
        { name: 'Monitors', slug: 'monitors', subCategories: [] },
        { name: 'Accessories', slug: 'accessories', subCategories: [] },
        { name: 'Storage', slug: 'storage', subCategories: [] },
        { name: 'Cabinets', slug: 'cabinets', subCategories: [] },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

                        <Link href={'/'} className="flex-shrink-0">
                            <Image
                                src="/logo/360.svg"
                                alt="Computer 360 Logo"
                                width={150}
                                height={150}
                                className=" h-auto"
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
                        <div className="mb-2">
                            <LocationPicker isMobile={true} />
                        </div>
                        <SearchBar onSearch={handleSearch} />
                    </div>
                )}

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
                                <h3 className="font-bold text-lg mb-3">Categories</h3>
                                {categories.map((category) => (
                                    <div key={category.name}>
                                        <Link
                                            href={`/category/${category.slug}`}
                                            className="block py-2 text-gray-700 hover:text-blue-600"
                                            onClick={closeMenu}
                                        >
                                            {category.name}
                                        </Link>
                                        {category.subCategories.map((subCat) => (
                                            <div key={subCat.name} className="ml-4">
                                                <Link
                                                    href={`/category/${category.slug}/${subCat.slug}`}
                                                    className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                                                    onClick={closeMenu}
                                                >
                                                    {subCat.name}
                                                </Link>
                                                {subCat.subSubCategories?.map((subSubCat) => (
                                                    <Link
                                                        key={subSubCat.name}
                                                        href={`/category/${category.slug}/${subCat.slug}/${subSubCat.slug}`}
                                                        className="block py-1 text-xs text-gray-500 hover:text-blue-600 ml-4"
                                                        onClick={closeMenu}
                                                    >
                                                        {subSubCat.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="py-4 mt-auto">
                                <h3 className="font-bold text-lg mb-3">Help & Support</h3>
                                <Link href="/contact" className="block py-2 text-gray-700 hover:text-blue-600" onClick={closeMenu}>
                                    Contact Us
                                </Link>
                                <Link href="/faq" className="block py-2 text-gray-700 hover:text-blue-600" onClick={closeMenu}>
                                    FAQ
                                </Link>
                                <Link href="/returns" className="block py-2 text-gray-700 hover:text-blue-600" onClick={closeMenu}>
                                    Returns & Refunds
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Categories Row with Hover Dropdown */}
                {isCategory && (
                    <div className="hidden md:block z-40 pb-2">
                        <div className="w-full flex items-center justify-center">
                            <ul className="flex justify-between w-full space-x-8 py-2 relative">
                                <li>
                                    <Link href="/category/all" className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors">
                                        All Categories
                                    </Link>
                                </li>
                                {categories.map((category) => (
                                    <li
                                        key={category.name}
                                        className="relative"
                                        onMouseEnter={() => setHoveredCategory(category.name)}
                                        onMouseLeave={() => setHoveredCategory(null)}
                                    >
                                        <Link
                                            href={`/category/${category.slug}`}
                                            className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors flex items-center"
                                        >
                                            {category.name}
                                            {category.subCategories.length > 0 && (
                                                <ChevronDown size={16} className="ml-1" />
                                            )}
                                        </Link>
                                        {hoveredCategory === category.name && category.subCategories.length > 0 && (
                                            <div className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-md z-50">
                                                {category.subCategories.map((subCat) => (
                                                    <div key={subCat.name} className="py-1">
                                                        <Link
                                                            href={`/category/${category.slug}/${subCat.slug}`}
                                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            {subCat.name}
                                                        </Link>
                                                        {subCat.subSubCategories?.map((subSubCat) => (
                                                            <Link
                                                                key={subSubCat.name}
                                                                href={`/category/${category.slug}/${subCat.slug}/${subSubCat.slug}`}
                                                                className="block px-6 py-1 text-sm text-gray-600 hover:bg-gray-100"
                                                            >
                                                                {subSubCat.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </header>
        </>
    );
};

export default Header;