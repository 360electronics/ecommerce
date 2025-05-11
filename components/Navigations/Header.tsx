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
import { Menu, X, ShoppingBag, Heart, User } from 'lucide-react';
import { slugify } from '@/utils/slugify';

interface HeaderProps {
    isCategory?: boolean
}

const Header = ({ isCategory = true }: HeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    // const searchInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    const categories = ['Laptops', 'Monitors', 'Processor', 'Graphics Card', 'Accessories', 'Storage',  'Cabinets'];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle outside clicks to close menu
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
        console.log(`Search triggered - Query: ${query}, Category: ${category}`);
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

    // const openSearch = () => {
    //     setIsSearchOpen(true);
    //     setTimeout(() => {
    //         if (searchInputRef.current) {
    //             searchInputRef.current.focus();
    //         }
    //     }, 100);
    // };

    return (
        <>
            <header
                className={`w-full bg-white pt-3 px-4 md:px-12 fixed top-0 left-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md' : ''
                    }`}
            >
                <div className="mx-auto flex items-center justify-between gap-2">
                    {/* Logo and Menu Button */}
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

                    {/* Desktop Nav Elements */}
                    <div className="hidden lg:flex items-center flex-grow">
                        <LocationPicker />
                        <div className="flex-grow mx-4">
                            <SearchBar onSearch={handleSearch} />
                        </div>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden lg:flex items-center gap-4">
                        <WishlistButton />
                        <UserButton />
                        <CartButton />
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <CartButton />
                    </div>
                </div>

                {/* Mobile Location and Search Bar */}
                {!isMenuOpen && !isSearchOpen && (
                    <div className="lg:hidden w-full bg-white py-2 border-t border-gray-200">
                        <div className="mb-2">
                            <LocationPicker isMobile={true} />
                        </div>
                        <SearchBar onSearch={handleSearch} />
                    </div>
                )}

                {/* Mobile Full Screen Menu */}
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

                            {/* Account Section */}
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

                            {/* Categories */}
                            <div className="py-4 border-b border-gray-200">
                                <h3 className="font-bold text-lg mb-3">Categories</h3>
                                {categories.map((category) => (
                                    <Link
                                        href={`/category/${category.toLowerCase()}`}
                                        key={category}
                                        className="block py-2 text-gray-700 hover:text-blue-600"
                                        onClick={closeMenu}
                                    >
                                        {category}
                                    </Link>
                                ))}
                            </div>

                            {/* Help & Support */}
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

                {/* Desktop Categories Row - NEW ADDITION */}
                {
                    isCategory && <div className="hidden md:block z-40  pb-2">
                        <div className=" ">
                            <div className=" w-full flex items-center justify-center">
                                <ul className="flex justify-between w-full space-x-8 py-2">
                                    <li>
                                        <Link href="/category/all" className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors">
                                            All Categories
                                        </Link>
                                    </li>
                                    {categories.map((category) => (
                                        <li key={category}>
                                            <Link
                                                href={`/category/${slugify(category)}`}
                                                className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors"
                                            >
                                                {category}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                }

            </header>



        </>
    );
};

export default Header;