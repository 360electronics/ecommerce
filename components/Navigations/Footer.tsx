"use client";
import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaFacebook, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const FeatureCard = memo(({ icon, title, description }: FeatureCardProps) => (
  <div className="flex flex-col">
    <div className="mb-3">{icon}</div>
    <h3 className="font-semibold text-sm md:text-base">{title}</h3>
    <p className="text-xs md:text-sm text-gray-600 mt-1">{description}</p>
  </div>
));
FeatureCard.displayName = "FeatureCard";

const Footer = () => {
  const features = [
    {
      icon: (
        <img
          src="/footer/truck-bolts.svg"
          alt="Fast Delivery"
          width={24}
          height={24}
        />
      ),
      title: "Fast Delivery",
      description: "Fast & reliable delivery options",
    },
    {
      icon: (
        <img
          src="/footer/digital-payments.svg"
          alt="Online payment"
          width={24}
          height={24}
        />
      ),
      title: "Online Payment",
      description: "100% secure & shop with confidence",
    },
    {
      icon: (
        <img
          src="/footer/shield-checks.svg"
          alt="Warranty"
          width={24}
          height={24}
        />
      ),
      title: "Extended Warranty",
      description: "Extended protection for peace of mind",
    },
    {
      icon: (
        <img
          src="/footer/user-headsets.svg"
          alt="Customer Support"
          width={24}
          height={24}
        />
      ),
      title: "Customer Support",
      description: "Expert help available 24/7",
    },
  ];

  const categoryLinks = [
    { href: "/category/laptops", label: "Laptops" },
    { href: "/category/monitors", label: "Monitors" },
    { href: "/category/accessories", label: "Mouse & Keyboards" },
    { href: "/category/processors", label: "Processors" },
    { href: "/category/graphics-card", label: "Graphics Card" },
  ];

  const accountLinks = [
    { href: "/profile/info", label: "My Account" },
    { href: "/profile/orders", label: "Order History" },
    { href: "/profile/wishlist", label: "Favourites" },
    { href: "/profile/referrals", label: "Referrals" },
    { href: "/profile/help", label: "Help Center" },
  ];

  const socialLinks = [
    {
      href: "https://www.instagram.com/computergarage360",
      icon: <FaInstagram size={22} />,
      label: "Instagram",
    },
    {
      href: "https://wa.me/7558132543?text=Hello",
      icon: <FaWhatsapp size={22} />,
      label: "WhatsApp",
    },
    {
      href: "https://youtube.com/@computergarage360",
      icon: <FaYoutube size={22} />,
      label: "YouTube",
    },
  ];

  return (
    <footer className="bg-gray-100 w-full">
      {/* Features */}
      <div className="mx-auto px-4 md:px-10 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-black text-white py-12">
        <div className="mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Categories */}
            <div>
              <h3 className="text-lg font-medium mb-4">Categories</h3>
              <ul className="space-y-2">
                {categoryLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-gray-300 hover:text-white text-sm transition"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* My Account */}
            <div>
              <h3 className="text-lg font-medium mb-4">My Account</h3>
              <ul className="space-y-2">
                {accountLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-gray-300 hover:text-white text-sm transition"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Headquarters Only */}
            <div>
              <h3 className="text-lg font-medium mb-4">Headquarters</h3>

              <div className="flex items-start">
                <FaLocationDot className="text-primary mt-1 mr-2" />

                <address className="not-italic text-sm text-gray-300 leading-relaxed">
                  Aruksan Arcade, 173-178,
                  <br />
                  Chinnasamy Naidu Rd, Siddhapudur,
                  <br />
                  Coimbatore, Tamil Nadu 641044
                  <br />
                </address>
              </div>

              <Link
                href="/store-locator"
                className="inline-block mt-4 text-primary hover:text-primary/80 text-sm underline transition"
              >
                Find All Stores →
              </Link>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-medium mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-300 hover:text-white text-sm transition"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-and-conditions"
                    className="text-gray-300 hover:text-white text-sm transition"
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund-policy"
                    className="text-gray-300 hover:text-white text-sm transition"
                  >
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cancellation-policy"
                    className="text-gray-300 hover:text-white text-sm transition"
                  >
                    Cancellation Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

        

          {/* Social */}
          <div className="mt-12 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex space-x-4 mb-4 md:mb-0">
              {socialLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-white hover:text-primary transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.icon}
                </Link>
              ))}
            </div>

            <div></div>
          </div>

          {/* Bottom-most bar */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-400 flex flec-col md:flex-row justify-between items-center">
            <p className="mb-2">
              © 360 Electronics {new Date().getFullYear()}. All Rights Reserved.
            </p>

            <p>
              Designed & Developed by{" "}
              <Link
                href="https://redefyne.in"
                className="underline text-primary hover:text-primary/80 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                ReDefyne Labs
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
