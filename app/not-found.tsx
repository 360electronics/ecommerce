"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import UserLayout from "@/components/Layouts/UserLayout";

export default function NotFoundPage() {
  return (
    <UserLayout>
      <div className=" flex items-center justify-center py-12">
        <div className="w-full  text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/logo/360_logo.PNG"
              alt="Computer Garage Logo"
              width={180}
              height={54}
              className="object-contain"
            />
          </div>

          <div>
            <h1 className=" text-primary text-9xl font-bold">404</h1>
          </div>
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {`You Lost, Page Not Found :(`}
          </h1>

          {/* Message */}
          <p className="text-gray-600 text-sm md:text-base">
            Oops! The page you’re looking for doesn’t exist or has been moved.
          </p>

          {/* Home Button */}
          <Link
            href="/"
            className={cn(
              "inline-block px-6 py-3 rounded-md font-medium text-white",
              "bg-primary hover:bg-primary/90 focus:outline-none ",
              "transition duration-300"
            )}
          >
            Back to Shopping
          </Link>

          {/* Support Link */}
          <div className="text-sm text-gray-600">
            <p>
              Need help?{" "}
              <Link
                href="/contact"
                className="text-primary font-semibold hover:underline"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
