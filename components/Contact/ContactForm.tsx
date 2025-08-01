'use client';

import React, { useState } from 'react';
import { ContactFormData } from '@/types/contact';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

const ContactForm: React.FC = () => {
    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
    };

    return (
        <div className="w-full flex justify-start">
            <div className="lg:max-w-xl max-w-md mx-auto lg:mx-0 w-full">
                <h2 className="text-2xl sm:text-3xl font-medium text-center mb-4">
                    Get in{" "}
                    <span className="inline-block relative">
                        <span className="relative z-10">touch</span>
                        <span className="absolute left-0 bottom-0 w-full h-[4px] bg-[#2874F0] rounded-full z-0"></span>
                    </span>
                </h2>

                <p className="text-[#00000099] mb-4 sm:mb-6 leading-relaxed text-center text-sm font-light px-2 sm:px-0">
                    Have a question or feedback? Fill out the form below or connect with us on
                    social media — we&apos;re here to assist you.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm text-gray-600 mb-2">
                            <span className='text-red-500'>*</span>Enter your name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors bg-white text-sm sm:text-base"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm text-gray-600 mb-2">
                            <span className='text-red-500'>*</span>Mail id
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors bg-white text-sm sm:text-base"
                        />
                    </div>

                    <div>
                        <label htmlFor="subject" className="block text-sm text-gray-600 mb-2">
                            <span className='text-red-500'>*</span>Subject
                        </label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors bg-white text-sm sm:text-base"
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm text-gray-600 mb-2">
                            <span className='text-red-500'>*</span>Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            required
                            rows={5}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border text-primary border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-vertical bg-white text-sm sm:text-base"
                        />
                    </div>

                    <Button className="rounded-full px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base">
                        Send message
                        <span className="bg-white text-primary rounded-full p-1">
                            <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                        </span>
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ContactForm;