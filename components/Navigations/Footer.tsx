'use client';
import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Youtube } from 'lucide-react';

// Types for improved type safety
type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

type FooterLinkProps = {
  href: string;
  label: string;
  external?: boolean;
};

type SocialLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
};

// Memoized FeatureCard to prevent unnecessary re-renders
const FeatureCard = memo(({ icon, title, description }: FeatureCardProps) => (
  <div className="flex flex-col">
    <div className="mb-3">{icon}</div>
    <h3 className="font-semibold text-sm md:text-base">{title}</h3>
    <p className="text-xs md:text-sm text-gray-600 mt-1">{description}</p>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

// Reusable FooterLink component
const FooterLink = ({ href, label, external = false }: FooterLinkProps) => (
  <li>
    <Link 
      href={href} 
      className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {label}
    </Link>
  </li>
);

// Reusable SocialLink component
const SocialLink = ({ href, icon, label }: SocialLinkProps) => (
  <a
    href={href}
    className="text-white hover:text-blue-500 transition-colors duration-200"
    aria-label={`Follow us on ${label}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    {icon}
  </a>
);

// WhatsApp icon component
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const Footer: React.FC = () => {
  // Feature data
  const features = [
    {
      icon: <Image src="/footer/truck-bolt.svg" alt="Fast Delivery" width={24} height={24} />,
      title: 'Fast Delivery',
      description: 'Fast & reliable delivery options',
    },
    {
      icon: <Image src="/footer/digital-payment.svg" alt="Online payment" width={24} height={24} />,
      title: 'Online Payment',
      description: '100% secure & shop with confidence',
    },
    {
      icon: <Image src="/footer/shield-check.svg" alt="Warranty" width={24} height={24} />,
      title: 'Extended Warranty',
      description: 'Extended protection for peace of mind',
    },
    {
      icon: <Image src="/footer/user-headset.svg" alt="Customer Support" width={24} height={24} />,
      title: 'Customer Support',
      description: 'Expert help available 24/7',
    },
  ];

  const categoryLinks = [
    { href: '/laptops', label: 'Laptops' },
    { href: '/monitors', label: 'Monitors' },
    { href: '/mouse-keyboards', label: 'Mouse & Keyboards' },
    { href: '/headphones-joystick', label: 'Headphones & Joystick' },
    { href: '/steering-chair', label: 'Steering & Chair' },
  ];

  const accountLinks = [
    { href: '/account', label: 'My Account' },
    { href: '/order-history', label: 'Order History' },
    { href: '/track-order', label: 'Track Order' },
    { href: '/favourites', label: 'Favourites' },
    { href: '/help', label: 'Help Center' },
  ];

  const socialLinks = [
    { href: 'https://instagram.com', icon: <Instagram size={24} />, label: 'Instagram' },
    { href: 'https://whatsapp.com', icon: <WhatsAppIcon />, label: 'WhatsApp' },
    { href: 'https://youtube.com', icon: <Youtube size={24} />, label: 'YouTube' },
    { href: 'https://facebook.com', icon: <Facebook size={24} />, label: 'Facebook' },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add newsletter subscription logic here
    console.log('Newsletter form submitted');
  };

  return (
    <footer className="bg-gray-100 w-full">
      {/* Features section */}
      <div className=" mx-auto px-4 md:px-10 py-8">
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

      {/* Main footer content */}
      <div className="bg-black text-white py-12 w-full">
        <div className=" mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Categories */}
            <nav aria-labelledby="categories-heading">
              <h3 id="categories-heading" className="text-lg font-medium mb-4">Categories</h3>
              <ul className="space-y-2">
                {categoryLinks.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </ul>
            </nav>

            {/* My Account */}
            <nav aria-labelledby="account-heading">
              <h3 id="account-heading" className="text-lg font-medium mb-4">My Account</h3>
              <ul className="space-y-2">
                {accountLinks.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </ul>
            </nav>

            {/* Newsletter */}
            <div>
              <h3 id="newsletter-heading" className="text-lg font-medium mb-4">Newsletter</h3>
              <form
                className="mt-4 space-y-4"
                onSubmit={handleNewsletterSubmit}
                aria-labelledby="newsletter-heading"
              >
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter Email Address"
                    className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-white"
                    required
                    aria-describedby="email-error"
                  />
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="privacy"
                    className="mt-1"
                    required
                    aria-describedby="privacy-label"
                  />
                  <label htmlFor="privacy" className="ml-2 text-xs text-gray-400" id="privacy-label">
                    I agree to the{' '}
                    <Link href="/privacy" className="underline hover:text-white transition-colors duration-200">
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link href="/terms" className="underline hover:text-white transition-colors duration-200">
                      Terms & Conditions
                    </Link>
                    .
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded transition duration-200"
                  aria-label="Subscribe to newsletter"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-medium mb-4">Our Locations</h3>
              <div className="flex flex-col space-y-2 text-sm">
                <span className="text-blue-500">Coimbatore</span>
                <span className="text-gray-400">Chennai</span>
              </div>
              <address className="mt-4 text-sm not-italic text-gray-300">
                Aruksan Arcade, 173-178,
                <br />
                Chinnasamy Naidu Rd, Siddhapudur,
                <br />
                New Siddhapudur, Coimbatore, Tamil Nadu 641044
              </address>
            </div>
          </div>

          {/* About, Contact, and Social */}
          <div className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* About and Contact */}
              <nav aria-label="Company Links" className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-6">
                <Link href="/about" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                  About Us
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                  Contact Us
                </Link>
              </nav>

              {/* Social Icons */}
              <div className="md:text-right">
                <p className="mb-4 text-sm">Follow us</p>
                <div className="flex space-x-4 md:justify-end">
                  {socialLinks.map((social) => (
                    <SocialLink
                      key={social.href}
                      href={social.href}
                      icon={social.icon}
                      label={social.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copyright and Developed By */}
          <div className="mt-8 w-full flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-800 text-xs text-gray-400">
            <p>Computers Garage Pvt. Ltd © 2012 - 2025. All Rights Reserved.</p>
            <p className="mt-2 md:mt-0">
              Developed by{' '}
              <Link
                href="https://redefyne.in"
                className="underline hover:text-white transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit developer website"
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