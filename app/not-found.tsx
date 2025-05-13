
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import UserLayout from '@/components/Layouts/UserLayout';

export default function NotFoundPage() {
    return (
        <UserLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center space-y-8">
                    {/* Logo */}
                    <div className="flex justify-center">
                        <Image
                            src="/logo/360.svg"
                            alt="Computer Garage Logo"
                            width={180}
                            height={54}
                            priority
                            className="object-contain"
                        />
                    </div>

                    {/* 404 Illustration */}
                    <div className="relative w-48 h-48 mx-auto">
                        <Image
                            src="/placeholder.svg"
                            alt="404 Not Found"
                            fill
                            sizes="100vw"
                            className="object-contain"
                            priority
                            placeholder="blur"
                            blurDataURL="/placeholder.svg"
                        />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                        Page Not Found
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 text-sm md:text-base">
                        Oops! The page you’re looking for doesn’t exist or has been moved.
                    </p>

                    {/* Home Button */}
                    <Link
                        href="/"
                        className={cn(
                            'inline-block px-6 py-3 rounded-md font-medium text-white',
                            'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
                            'transition duration-300'
                        )}
                    >
                        Back to Home
                    </Link>

                    {/* Support Link */}
                    <div className="text-sm text-gray-600">
                        <p>
                            Need help?{' '}
                            <Link href="/support" className="text-blue-600 font-semibold hover:underline">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}

