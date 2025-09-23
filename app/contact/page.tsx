// pages/contact.tsx or app/contact/page.tsx
import React from 'react';
import ContactForm from '@/components/Contact/ContactForm';
import ContactInfo from '@/components/Contact/ContactInfo';
import Image from 'next/image';
import UserLayout from '@/components/Layouts/UserLayout';
import Link from 'next/link';
import { Home } from 'lucide-react';

const ContactPage: React.FC = () => {
    return (
        <UserLayout isCategory={false}>
            {/* Hero Banner - Full Width at Top */}
            <div className='relative'>
                <img 
                    src="/contact/banner.png" 
                    width={500} 
                    height={500} 
                    alt='BannerImg' 
                    className='object-cover w-full' 
                />
            </div>

            {/* Main Content - Responsive Layout */}
            <div className="px-4 sm:px-6 lg:px-0 mb-32">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-0 mt-12 sm:mt-16 lg:mt-20">
                    {/* Contact Info - Full width on mobile, left column on desktop */}
                    <div className="w-full lg:pr-8">
                        <ContactInfo />
                    </div>
                    
                    {/* Contact Form - Full width on mobile, right column on desktop */}
                    <div className="w-full lg:pl-8">
                        <ContactForm />
                    </div>
                </div>
            </div>
        </UserLayout>
    );
};

export default ContactPage;