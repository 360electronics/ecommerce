import React from 'react';
import { Phone, Mail, Map } from 'lucide-react';
import Link from 'next/link';

const ContactInfo = () => {
    const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d8020451.191950306!2d67.2161867!3d11.020917!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859547cf93e8d%3A0x5707da2004001b97!2sComputer%20Garage%20360!5e0!3m2!1sen!2sin!4v1760786665374!5m2!1sen!2sin";


    return (
        <div className="w-full mx-auto bg-white">
            {/* Header */}
            <h1 className="text-2xl sm:text-3xl font-normal text-black mb-8 sm:mb-12 lg:mb-16 leading-tight max-w-2xl">
                We are always ready to help you and answer your questions
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 sm:gap-10 lg:gap-14 mt-12 sm:mt-16 lg:mt-20">
                {/* Phone Section */}
                <div className="flex items-start space-x-4">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-black mt-1 flex-shrink-0" />
                    <div>
                        <h3 className="text-base font-medium text-black mb-3 sm:mb-4">Phone</h3>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700">+91 7558132543</p>
                        </div>
                    </div>
                </div>

                {/* Address Section */}
                <div className="flex items-start space-x-4">
                    <Map className="w-5 h-5 sm:w-6 sm:h-6 text-black mt-1 flex-shrink-0" />
                    <div>
                        <h3 className="text-base font-medium text-black mb-3 sm:mb-4">Address</h3>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700">360 Electronics, <br />173-178, Chinnaswamy Road,<br /> New Siddhapudur, Coimbatore,<br /> Tamil Nadu - 641044</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start justify-between space-y-6 sm:space-y-0 sm:space-x-4">
                    {/* Email Section */}
                    <div className="flex flex-col space-y-4 w-full sm:w-auto">
                        <div className='flex flex-row items-center gap-3'>
                            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0" />
                            <h3 className="text-base font-semibold text-black">Email</h3>
                        </div>
                        <p className="text-sm underline break-all">360electronicspvtltd@gmail.com</p>
                    </div>

                    {/* Right Column - Social Media */}
                    <div className="w-full sm:w-auto">
                        <h3 className="text-base font-semibold text-black mb-4 sm:mb-4">Social media links</h3>
                        <div className="flex space-x-3 sm:space-x-4">
                            {/* Instagram */}
                            <Link target='_blank' href="https://www.instagram.com/computergarage360?igsh=MWFqbTdqcml2ZTQ5&utm_source=qr" className="w-6 h-6 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-black">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </Link>

                            {/* WhatsApp */}
                            <Link target='_blank' href="https://wa.me/7558132543?text=Hello" className="w-6 h-6 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-black">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                </svg>
                            </Link>

                            {/* YouTube */}
                            <Link target='_blank' href="https://youtube.com/@computergarage360?si=hg6lHMk8852pw_92" className="w-6 h-6 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-black">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="mt-12 sm:mt-16 lg:mt-20">
                <div className="relative h-40 sm:h-48 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                    {/* Real Google Map */}
                    <iframe
                        src={mapEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Location Map"
                        className="rounded-lg"
                    />
                </div>
            </div>
        </div>
    );
};


export default ContactInfo;