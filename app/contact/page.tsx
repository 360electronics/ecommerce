// pages/contact.tsx or app/contact/page.tsx
import React from "react";
import ContactForm from "@/components/Contact/ContactForm";
import ContactInfo from "@/components/Contact/ContactInfo";

const ContactPage: React.FC = () => {
  return (
      <>
        {/* Hero Banner - Full Width at Top */}
        <div className="relative">
          <img
            src="/contact/banner.png"
            width={500}
            height={500}
            alt="BannerImg"
            className="object-cover w-full"
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
      </>
  );
};

export default ContactPage;
