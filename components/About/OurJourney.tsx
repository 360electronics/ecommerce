"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Updated data structure with business timeline details
const OurJourneyData = [
    {
        id: "content-section-1",
        type: "content",
        year: "2017",
        title: "Opening of our first retail store",
        description: "Aruksun Arcade, 173-178, Chinnasamy Naidu Rd, Siddhapudur, New Siddhapudur, Coimbatore, Tamil Nadu 641044",
        content: "Our journey began with the opening of our first retail store in the heart of Coimbatore. This milestone marked the beginning of our commitment to providing quality computer hardware and services to the local community.",
        image: "/about/JourneyImg1.png"
    },
    {
        id: "content-section-2", 
        type: "content",
        year: "2022",
        title: "Expansion and Growth",
        description: "Aruksun Arcade, 173-178, Chinnasamy Naidu Rd, Siddhapudur, New Siddhapudur, Coimbatore, Tamil Nadu 641044",
        content: "Five years later, we expanded our operations and enhanced our service offerings. This period marked significant growth in our customer base and the introduction of new product categories to better serve our community's evolving technology needs."
    },
    {
        id: "content-section-3",
        type: "content", 
        year: "2024",
        title: "Continued Excellence",
        description: "Aruksun Arcade, 173-178, Chinnasamy Naidu Rd, Siddhapudur, New Siddhapudur, Coimbatore, Tamil Nadu 641044",
        content: "Building on our success, we continued to innovate and adapt to the changing technology landscape. Our commitment to excellence and customer satisfaction remained at the core of our operations as we prepared for future growth.",
        image: "/about/JourneyImg2.png"
    },
    {
        id: "content-section-4",
        type: "content",
        year: "2025",
        title: "Launched E-commerce Website",
        description: "360computergarage.in - Taking our services online to reach customers beyond our physical location",
        content: "We launched our e-commerce platform to serve customers across India. This digital transformation allows us to offer our quality products and expertise to a wider audience while maintaining the personalized service our local customers have come to expect."
    }
];

const OurJourney = () => {
    const [active, setActive] = useState<string>(OurJourneyData[0].id);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight / 2;

            sectionRefs.current.forEach((ref, index) => {
                if (ref) {
                    const { offsetTop, offsetHeight } = ref;
                    if (
                        scrollPosition >= offsetTop &&
                        scrollPosition < offsetTop + offsetHeight
                    ) {
                        setActive(OurJourneyData[index].id);
                    }
                }
            });
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen pt-6 md:py-10 bg-white">
            {OurJourneyData.map((item, index) => {
                const isActiveSection = active === item.id;
                const hasImage = item.image;

                return (
                    <div
                        key={item.id}
                        ref={(el) => {
                            sectionRefs.current[index] = el;
                        }}
                        className="min-h-screen sticky top-6 md:top-0 flex items-center justify-center"
                    >
                        <div className="w-full px-4 mx-auto min-h-[90vh]  md:h-screen flex items-center justify-center">
                            <div className={`max-w-6xl mx-auto ${
                                hasImage ? 'grid grid-cols-1 bg-primary rounded-[20px]  md:grid-cols-[0.6fr_1fr] gap-6 md:gap-8 items-center' : 'flex items-center justify-center'
                            }`}>

                                {/* Image Section - Only show if image exists */}
                                {hasImage && (
                                    <div className="relative h-full w-full flex items-center justify-center">
                                        <div className="w-full ml-6 relative rounded-[20px] p-4 flex items-center justify-center">
                                            <div className="w-full h-full relative rounded-[16px] overflow-hidden">
                                                <Image
                                                    src={item.image}
                                                    alt={`${item.title} image`}
                                                    width={500}
                                                    height={700}
                                                    className="h-full w-full object-cover filter "
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Content Section */}
                                <div className="relative h-full w-full flex items-center justify-center">
                                    <div className="bg-primary text-white p-8 md:p-12 rounded-[20px] w-full h-[400px] md:h-[500px] flex flex-col justify-center">
                                        <div className="text-4xl md:text-6xl font-bold mb-6 text-white">
                                            {item.year}
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold mb-4">
                                            {item.title}
                                        </h2>
                                        <p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed">
                                            {item.description}
                                        </p>
                                        <p className="text-white text-sm md:text-base leading-relaxed">
                                            {item.content}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OurJourney;