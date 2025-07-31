'use client';
import React, { memo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaInstagram as Instagram, FaFacebook as Facebook, FaYoutube as Youtube, FaWhatsapp as Whatsapp } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

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

type Location = {
  name: string;
  address: string[];
};

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
  <Link
    href={href}
    className="text-white hover:text-blue-500 transition-colors duration-200"
    aria-label={`Follow us on ${label}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    {icon}
  </Link>
);

const Footer = () => {
  // Define locations data
  const locations: Location[] = [
    {
      name: "Coimbatore",
      address: [
        "Aruksan Arcade, 173-178,",
        "Chinnasamy Naidu Rd, Siddhapudur,",
        "New Siddhapudur, Coimbatore, Tamil Nadu 641044"
      ]
    },
    {
      name: "Chennai",
      address: [
        "Ascendas IT Park, 3rd Floor,",
        "Taramani Road, Taramani,",
        "Chennai, Tamil Nadu 600113"
      ]
    }
  ];

  // State for selected location
  const [selectedLocation, setSelectedLocation] = useState(0); // Default is Coimbatore (index 0)
  const [email, setEmail] = useState("");
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);

  // Feature data
  const features = [
    {
      icon: <Image src="/footer/truck-bolts.svg" alt="Fast Delivery" width={24} height={24} />,
      title: 'Fast Delivery',
      description: 'Fast & reliable delivery options',
    },
    {
      icon: <Image src="/footer/digital-payments.svg" alt="Online payment" width={24} height={24} />,
      title: 'Online Payment',
      description: '100% secure & shop with confidence',
    },
    {
      icon: <Image src="/footer/shield-checks.svg" alt="Warranty" width={24} height={24} />,
      title: 'Extended Warranty',
      description: 'Extended protection for peace of mind',
    },
    {
      icon: <Image src="/footer/user-headsets.svg" alt="Customer Support" width={24} height={24} />,
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
    { href: 'https://whatsapp.com', icon: <Whatsapp size={24} />, label: 'WhatsApp' },
    { href: 'https://youtube.com', icon: <Youtube size={24} />, label: 'YouTube' },
    { href: 'https://facebook.com', icon: <Facebook size={24} />, label: 'Facebook' },
  ];

  const handleNewsletterSubmit = () => {
    if (email && isPrivacyChecked) {
      console.log('Newsletter form submitted with email:', email);
      // Add newsletter subscription logic here
      setEmail("");
      setIsPrivacyChecked(false);
    }
  };

  return (
    <footer className="bg-gray-100 w-full">
      {/* Features section */}
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

      {/* Main footer content */}
      <div className="bg-black text-white py-12 w-full">
        <div className="mx-auto px-4 md:px-10">
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
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter Email Address"
                    className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded focus:outline-none focus:border-primary text-white"
                    required
                    aria-describedby="email-error"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="privacy"
                    className="mt-1"
                    required
                    aria-describedby="privacy-label"
                    checked={isPrivacyChecked}
                    onChange={(e) => setIsPrivacyChecked(e.target.checked)}
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
                  onClick={handleNewsletterSubmit}
                  className="w-full py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover text-white font-medium rounded transition duration-200"
                  aria-label="Subscribe to newsletter"
                >
                  Subscribe
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-medium mb-4">Our Locations</h3>
              <div className="flex space-x-4 mb-4">
                {locations.map((location, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2  text-sm transition duration-200 ${
                      selectedLocation === index
                        ? "border-b-primary border-b text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setSelectedLocation(index)}
                    aria-pressed={selectedLocation === index}
                    aria-label={`Select ${location.name} location`}
                  >
                    {location.name}
                  </button>
                ))}
              </div>
              
              <div className="flex items-start">
                <FaLocationDot className="text-primary mt-1 mr-2 flex-shrink-0" />
                <address className="not-italic text-sm text-gray-300">
                  {locations[selectedLocation].address.map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </address>
              </div>
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
              Designed & Developed by{' '}
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