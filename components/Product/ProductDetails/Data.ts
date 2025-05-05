// Product interfaces
export interface ProductColor {
    name: string
    value: string
}

export interface StorageOption {
    value: string
    label: string
}

export interface SpecificationItem {
    label: string
    value: string
}

export interface SpecificationSection {
    title: string
    items: SpecificationItem[]
}

export interface ReviewImage {
    src: string
    alt: string
}

export interface ReviewAuthor {
    name: string
    avatar: string
    date: string
}

export interface Review {
    id: number
    author: ReviewAuthor
    rating: number
    comment: string
    images?: ReviewImage[]
}

export interface CategoryRating {
    name: string
    value: number
}

export interface RatingDistribution {
    value: number
    count: number
}

export interface ProductData {
    id: number
    name: string
    slug: string
    description: string
    category: string
    mrp: number
    ourPrice: number
    status: "active" | "inactive"
    subProductStatus: "active" | "inactive"
    totalStocks: number
    deliveryMode: "standard" | "express"
    productImages: string[]
    sku: string
    averageRating: number
    ratingCount: number
    discount: number
    colors: ProductColor[]
    ramOptions: StorageOption[]
    specifications: SpecificationSection[]
    reviews: Review[]
    ratingDistribution: RatingDistribution[]
    categoryRatings: CategoryRating[]
    deliveryDate: string
}

// Product data
export const products: ProductData[] = [
    // Product 1: MacBook Air M4
    {
        id: 1,
        name: 'Apple Macbook Air M4 Chip/ 13 inch/ 34.46 cm (13.6")/ 16GB/ 256GB - Skyblue MCGT4HN/A',
        slug: "apple-macbook-air-m4-chip-13-inch-skyblue",
        description:
            "The Apple MacBook Air with M4 chip delivers exceptional performance in an incredibly thin design. With a stunning 13.6-inch Liquid Retina display, up to 18 hours of battery life, and powerful features, it's the perfect everyday laptop for work, play, and creativity.",
        category: "Laptops",
        mrp: 120000,
        ourPrice: 99900,
        status: "active",
        subProductStatus: "active",
        totalStocks: 50,
        deliveryMode: "express",
        productImages: [
            "https://img.freepik.com/free-photo/ai-programs-used-server-room-ensure-optimal-system-performance_482257-118354.jpg?t=st=1746175320~exp=1746178920~hmac=bc246753ff5ded4981dd416827a21a3b0d72b6cdc5b0b59c7476b55732ede698&w=1800",
            "https://img.freepik.com/free-photo/ai-programs-used-server-room-ensure-optimal-system-performance_482257-118354.jpg?t=st=1746175320~exp=1746178920~hmac=bc246753ff5ded4981dd416827a21a3b0d72b6cdc5b0b59c7476b55732ede698&w=1800",
            "https://img.freepik.com/free-photo/ai-programs-used-server-room-ensure-optimal-system-performance_482257-118354.jpg?t=st=1746175320~exp=1746178920~hmac=bc246753ff5ded4981dd416827a21a3b0d72b6cdc5b0b59c7476b55732ede698&w=1800",
            "https://img.freepik.com/free-photo/ai-programs-used-server-room-ensure-optimal-system-performance_482257-118354.jpg?t=st=1746175320~exp=1746178920~hmac=bc246753ff5ded4981dd416827a21a3b0d72b6cdc5b0b59c7476b55732ede698&w=1800",
            "https://img.freepik.com/free-photo/ai-programs-used-server-room-ensure-optimal-system-performance_482257-118354.jpg?t=st=1746175320~exp=1746178920~hmac=bc246753ff5ded4981dd416827a21a3b0d72b6cdc5b0b59c7476b55732ede698&w=1800",
            "https://img.freepik.com/free-photo/ai-programs-used-server-room-ensure-optimal-system-performance_482257-118354.jpg?t=st=1746175320~exp=1746178920~hmac=bc246753ff5ded4981dd416827a21a3b0d72b6cdc5b0b59c7476b55732ede698&w=1800",
        ],
        sku: "MCGT4HN/A",
        averageRating: 4.6,
        ratingCount: 139,
        discount: 18,
        colors: [
            { name: "Skyblue", value: "#87CEEB" },
            { name: "Silver", value: "#E8E8E8" },
            { name: "Starlight", value: "#F9E5C9" },
            { name: "Midnight", value: "#2C3E50" },
        ],
        ramOptions: [
            { value: "16gb_256gb", label: "16 RAM / 256 GB" },
            { value: "16gb_512gb", label: "16 RAM / 512 GB" },
        ],
        specifications: [
            {
                title: "GENERAL FEATURE",
                items: [
                    { label: "BRAND", value: "Apple" },
                    { label: "SERIES", value: "MacBook Air 13 Inch" },
                    { label: "MODEL NAME", value: "MCGT4HN/A" },
                    { label: "SKU", value: "MCGT4HN/A" },
                    { label: "COLOR", value: "Sky Blue" },
                ],
            },
            {
                title: "CHIP",
                items: [
                    {
                        label: "Apple M4 Chip",
                        value:
                            "10-Core CPU With 4 Performance Cores And 6 Efficiency Cores | 8-Core GPU | Hardware-Accelerated Ray Tracing | 16-Core Neural Engine | 120GB/S Memory Bandwidth",
                    },
                    {
                        label: "Media Engine",
                        value:
                            "Hardware-Accelerated H.264, HEVC, ProRes And ProRes RAW | Video Decode Engine | Video Encode Engine | ProRes Encode And Decode Engine | AV1 Decode",
                    },
                ],
            },
            {
                title: "APPLE INTELLIGENCE",
                items: [
                    {
                        label: "Apple Intelligence",
                        value:
                            "Apple Intelligence Is The Personal Intelligence System That Helps You Write, Express Yourself And Get Things Done Effortlessly. With Groundbreaking Privacy Protections, It Gives You Peace Of Mind That No One Else Can Access Your Data - Not Even Apple.",
                    },
                ],
            },
            {
                title: "DISPLAY",
                items: [
                    {
                        label: "Liquid Retina Display",
                        value:
                            "34.46 Cm / 13.6 Inch (Diagonal) LED-Backlit Display With IPS Technology | 2560x1664 Native Resolution At 224 Pixels Per Inch | 500 Nits Brightness",
                    },
                    {
                        label: "Colour",
                        value: "Support For 1 Billion Colours | Wide Colour (P3) | True Tone Technology",
                    },
                ],
            },
            {
                title: "MEMORY",
                items: [
                    { label: "Memory", value: "16GB Unified Memory" },
                    { label: "Configurable To", value: "24GB Or 32GB" },
                ],
            },
        ],
        reviews: [
            {
                id: 1,
                author: {
                    name: "Cody Fisher",
                    avatar: "/diverse-group.png",
                    date: "11/7/16",
                },
                rating: 4.0,
                comment: "Good battery",
                images: [
                    {
                        src: "https://img.freepik.com/free-photo/open-laptop-with-blank-white-screen-against-pink-background_23-2147916361.jpg?t=st=1746278867~exp=1746282467~hmac=cecdbda88b1677cefd94d29736ecf121f6d11ca024000ee42b09b0b61ce3cf12&w=1380",
                        alt: "Review image",
                    },
                ],
            },
            {
                id: 2,
                author: {
                    name: "Marvin McKinney",
                    avatar: "/diverse-group.png",
                    date: "1/28/17",
                },
                rating: 4.0,
                comment: "Best Quality",
                images: [
                    {
                        src: "https://img.freepik.com/free-photo/blank-screen-workspace-with-computer-laptop-table-night-copy-space_169016-56936.jpg?t=st=1746278888~exp=1746282488~hmac=1c1059766f2d7164e9fc07f6db210a72a8e4b96e263cb8031c5dfc715e0e46f6&w=1380",
                        alt: "Review image",
                    },
                ],
            },
            {
                id: 3,
                author: {
                    name: "Savannah Nguyen",
                    avatar: "/diverse-group.png",
                    date: "9/23/16",
                },
                rating: 4.0,
                comment: "One of the great product",
                images: [
                    {
                        src: "https://img.freepik.com/free-photo/office-desktop-with-laptop_23-2148179163.jpg?t=st=1746278827~exp=1746282427~hmac=85c62ee01e92a9723b8cbd7f75c40324d5f407b9beb842bc4933bc033b715abf&w=1380",
                        alt: "Review image",
                    },
                ],
            },
        ],
        ratingDistribution: [
            { value: 5, count: 112 },
            { value: 4, count: 60 },
            { value: 3, count: 45 },
            { value: 2, count: 0 },
            { value: 1, count: 5 },
        ],
        categoryRatings: [
            { name: "Performance", value: 4.5 },
            { name: "Display", value: 4.4 },
            { name: "Battery", value: 4.3 },
            { name: "Design&look", value: 4.9 },
        ],
        deliveryDate: "11 April, 2025",
    },

    // Product 2: Gaming Laptop
    {
        id: 2,
        name: "ASUS ROG Strix G16 Gaming Laptop/ 16 inch/ 40.64 cm/ Intel Core i9-14900HX/ 32GB/ 1TB SSD/ RTX 4070/ Eclipse Gray",
        slug: "asus-rog-strix-g16-gaming-laptop",
        description:
            "Dominate the gaming arena with the ASUS ROG Strix G16 Gaming Laptop. Powered by the latest Intel Core i9-14900HX processor and NVIDIA GeForce RTX 4070 graphics, this beast delivers uncompromising performance for the most demanding games and creative tasks.",
        category: "Gaming Laptops",
        mrp: 225000,
        ourPrice: 189990,
        status: "active",
        subProductStatus: "active",
        totalStocks: 25,
        deliveryMode: "express",
        productImages: [
            "/placeholder.svg?height=400&width=400&query=asus rog strix g16",
            "/placeholder.svg?height=400&width=400&query=asus rog strix keyboard",
            "/placeholder.svg?height=400&width=400&query=asus rog strix side view",
            "/placeholder.svg?height=400&width=400&query=asus rog strix ports",
            "/placeholder.svg?height=400&width=400&query=asus rog strix screen",
        ],
        sku: "G614JZR-N3077WS",
        averageRating: 4.8,
        ratingCount: 87,
        discount: 15,
        colors: [
            { name: "Eclipse Gray", value: "#3A3A3C" },
            { name: "Volt Green", value: "#A3D951" },
        ],
        ramOptions: [
            { value: "16gb_1tb", label: "16 RAM / 1TB SSD" },
            { value: "32gb_1tb", label: "32 RAM / 1TB SSD" },
            { value: "32gb_2tb", label: "32 RAM / 2TB SSD" },
        ],
        specifications: [
            {
                title: "GENERAL FEATURE",
                items: [
                    { label: "BRAND", value: "ASUS" },
                    { label: "SERIES", value: "ROG Strix G16" },
                    { label: "MODEL NAME", value: "G614JZR-N3077WS" },
                    { label: "SKU", value: "G614JZR-N3077WS" },
                    { label: "COLOR", value: "Eclipse Gray" },
                ],
            },
            {
                title: "PROCESSOR",
                items: [
                    {
                        label: "Processor",
                        value: "Intel Core i9-14900HX (24 Cores, 32 Threads, 36MB Cache, up to 5.8GHz)",
                    },
                    {
                        label: "Graphics",
                        value: "NVIDIA GeForce RTX 4070 8GB GDDR6 (TGP 140W with Dynamic Boost)",
                    },
                ],
            },
            {
                title: "DISPLAY",
                items: [
                    {
                        label: "Display",
                        value:
                            "16-inch (40.64 cm) QHD+ (2560 x 1600) 16:10 IPS-level, 240Hz, 3ms, 500 nits, 100% DCI-P3, Pantone Validated, G-SYNC",
                    },
                ],
            },
            {
                title: "MEMORY & STORAGE",
                items: [
                    { label: "RAM", value: "32GB DDR5 4800MHz (2x 16GB, Upgradeable to 64GB)" },
                    { label: "Storage", value: "1TB PCIe 4.0 NVMe M.2 SSD (Upgradeable, 2x M.2 Slots)" },
                ],
            },
            {
                title: "CONNECTIVITY",
                items: [
                    {
                        label: "Ports",
                        value:
                            "1x Thunderbolt 4, 1x USB 3.2 Gen 2 Type-C, 2x USB 3.2 Gen 2 Type-A, 1x HDMI 2.1, 1x RJ45 LAN, 1x 3.5mm Combo Audio Jack",
                    },
                    {
                        label: "Wireless",
                        value: "Wi-Fi 6E (802.11ax) + Bluetooth 5.3",
                    },
                ],
            },
        ],
        reviews: [
            {
                id: 1,
                author: {
                    name: "Alex Johnson",
                    avatar: "/diverse-group.png",
                    date: "03/15/24",
                },
                rating: 5.0,
                comment: "Incredible performance for gaming and content creation. The 240Hz display is amazing!",
                images: [
                    {
                        src: "/placeholder.svg?height=200&width=200&query=gaming setup",
                        alt: "Gaming setup with ROG Strix",
                    },
                ],
            },
            {
                id: 2,
                author: {
                    name: "Sarah Williams",
                    avatar: "/diverse-group.png",
                    date: "02/28/24",
                },
                rating: 4.5,
                comment: "Great laptop but runs a bit hot under heavy load. Otherwise perfect for my needs.",
            },
            {
                id: 3,
                author: {
                    name: "Michael Chen",
                    avatar: "/diverse-group.png",
                    date: "02/10/24",
                },
                rating: 5.0,
                comment: "Best gaming laptop I've ever owned. The RTX 4070 handles everything I throw at it.",
                images: [
                    {
                        src: "/placeholder.svg?height=200&width=200&query=gaming benchmark",
                        alt: "Benchmark results",
                    },
                ],
            },
        ],
        ratingDistribution: [
            { value: 5, count: 65 },
            { value: 4, count: 18 },
            { value: 3, count: 3 },
            { value: 2, count: 1 },
            { value: 1, count: 0 },
        ],
        categoryRatings: [
            { name: "Performance", value: 4.9 },
            { name: "Display", value: 4.8 },
            { name: "Battery", value: 4.0 },
            { name: "Design&look", value: 4.7 },
        ],
        deliveryDate: "5 April, 2025",
    },

    // Product 3: Smartphone
    {
        id: 3,
        name: "Samsung Galaxy S24 Ultra 5G/ 6.8 inch/ 17.27 cm/ 12GB/ 512GB/ Titanium Gray/ 200MP Camera",
        slug: "samsung-galaxy-s24-ultra-5g",
        description:
            "Experience the pinnacle of smartphone innovation with the Samsung Galaxy S24 Ultra. Featuring a stunning 6.8-inch Dynamic AMOLED 2X display, powerful Snapdragon 8 Gen 3 processor, and a revolutionary 200MP camera system, this flagship device redefines what's possible in mobile photography and performance.",
        category: "Smartphones",
        mrp: 149999,
        ourPrice: 134999,
        status: "active",
        subProductStatus: "active",
        totalStocks: 75,
        deliveryMode: "express",
        productImages: [
            "/placeholder.svg?height=400&width=400&query=samsung galaxy s24 ultra titanium",
            "/placeholder.svg?height=400&width=400&query=samsung galaxy s24 ultra camera",
            "/placeholder.svg?height=400&width=400&query=samsung galaxy s24 ultra display",
            "/placeholder.svg?height=400&width=400&query=samsung galaxy s24 ultra s pen",
            "/placeholder.svg?height=400&width=400&query=samsung galaxy s24 ultra back",
        ],
        sku: "SM-S928BZAGINU",
        averageRating: 4.7,
        ratingCount: 213,
        discount: 10,
        colors: [
            { name: "Titanium Gray", value: "#4E4E4E" },
            { name: "Titanium Black", value: "#1A1A1A" },
            { name: "Titanium Violet", value: "#9C8CBB" },
            { name: "Titanium Yellow", value: "#FBE698" },
        ],
        ramOptions: [
            { value: "12gb_256gb", label: "12 RAM / 256 GB" },
            { value: "12gb_512gb", label: "12 RAM / 512 GB" },
            { value: "12gb_1tb", label: "12 RAM / 1 TB" },
        ],
        specifications: [
            {
                title: "GENERAL FEATURE",
                items: [
                    { label: "BRAND", value: "Samsung" },
                    { label: "SERIES", value: "Galaxy S" },
                    { label: "MODEL NAME", value: "Galaxy S24 Ultra" },
                    { label: "SKU", value: "SM-S928BZAGINU" },
                    { label: "COLOR", value: "Titanium Gray" },
                ],
            },
            {
                title: "DISPLAY",
                items: [
                    {
                        label: "Display",
                        value:
                            "6.8-inch (17.27 cm) QHD+ Dynamic AMOLED 2X, 3120 x 1440 pixels, 120Hz Adaptive Refresh Rate, 2600 nits peak brightness, HDR10+",
                    },
                    {
                        label: "Protection",
                        value: "Corning Gorilla Armor, IP68 water and dust resistance",
                    },
                ],
            },
            {
                title: "PROCESSOR & MEMORY",
                items: [
                    {
                        label: "Processor",
                        value: "Snapdragon 8 Gen 3 for Galaxy (4nm), Octa-core CPU",
                    },
                    {
                        label: "RAM",
                        value: "12GB LPDDR5X",
                    },
                    {
                        label: "Storage",
                        value: "512GB UFS 4.0 (Non-expandable)",
                    },
                ],
            },
            {
                title: "CAMERA",
                items: [
                    {
                        label: "Rear Camera",
                        value:
                            "Quad Camera: 200MP Wide (f/1.7, OIS) + 12MP Ultra-wide (f/2.2, 120°) + 50MP Telephoto (f/3.4, 5x optical zoom, OIS) + 10MP Telephoto (f/2.4, 3x optical zoom, OIS)",
                    },
                    {
                        label: "Front Camera",
                        value: "12MP (f/2.2, Dual Pixel AF)",
                    },
                    {
                        label: "Video",
                        value: "8K@30fps, 4K@60fps, Super Steady, HDR10+",
                    },
                ],
            },
            {
                title: "BATTERY & CHARGING",
                items: [
                    { label: "Battery", value: "5000mAh" },
                    { label: "Charging", value: "45W Wired, 15W Wireless, 4.5W Reverse Wireless" },
                ],
            },
        ],
        reviews: [
            {
                id: 1,
                author: {
                    name: "Emily Rodriguez",
                    avatar: "/diverse-group.png",
                    date: "02/25/24",
                },
                rating: 5.0,
                comment:
                    "The camera on this phone is absolutely incredible. Night mode photos look like they were taken in daylight!",
                images: [
                    {
                        src: "/placeholder.svg?height=200&width=200&query=night photography smartphone",
                        alt: "Night mode photo sample",
                    },
                ],
            },
            {
                id: 2,
                author: {
                    name: "David Kim",
                    avatar: "/diverse-group.png",
                    date: "02/18/24",
                },
                rating: 4.5,
                comment:
                    "Amazing phone overall. Battery life could be better, but the S Pen functionality is game-changing for me.",
                images: [
                    {
                        src: "/placeholder.svg?height=200&width=200&query=s pen drawing",
                        alt: "S Pen drawing sample",
                    },
                ],
            },
            {
                id: 3,
                author: {
                    name: "Jessica Patel",
                    avatar: "/diverse-group.png",
                    date: "03/05/24",
                },
                rating: 4.0,
                comment: "Great performance and beautiful display. The titanium frame feels premium, but it's quite heavy.",
            },
            {
                id: 4,
                author: {
                    name: "Robert Wilson",
                    avatar: "/diverse-group.png",
                    date: "02/10/24",
                },
                rating: 5.0,
                comment: "The AI features are incredibly useful. Photo editing and translation have never been easier.",
                images: [
                    {
                        src: "/placeholder.svg?height=200&width=200&query=smartphone ai features",
                        alt: "AI feature demonstration",
                    },
                ],
            },
        ],
        ratingDistribution: [
            { value: 5, count: 145 },
            { value: 4, count: 52 },
            { value: 3, count: 12 },
            { value: 2, count: 3 },
            { value: 1, count: 1 },
        ],
        categoryRatings: [
            { name: "Camera", value: 4.9 },
            { name: "Display", value: 4.8 },
            { name: "Battery", value: 4.2 },
            { name: "Design&look", value: 4.7 },
        ],
        deliveryDate: "3 April, 2025",
    },
]

// Function to get product by ID
export const getProductById = (id: number): ProductData | undefined => {
    return products.find((product) => product.id === id)
}

// Function to get product by slug
export const getProductBySlug = (slug: string): ProductData | undefined => {
    return products.find((product) => product.slug === slug)
}

// Export default for convenience
export default products
