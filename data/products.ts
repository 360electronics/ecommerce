export interface Review {
    user: string;
    rating: number;
    comment: string;
}

export interface Specifications {
    sensor?: string;
    dpi?: string;
    connectivity?: string;
    buttons?: string;
    switchType?: string;
    backlighting?: string;
    macroKeys?: string;
    batteryLife?: string;
    driverSize?: string;
    microphone?: string;
    screenSize?: string;
    resolution?: string;
    refreshRate?: string;
    responseTime?: string;
    material?: string;
    weightCapacity?: string;
    adjustability?: string;
    size?: string;
    thickness?: string;
    surface?: string;
    speed?: string;
    bands?: string;
    ports?: string;
    power?: string;
    subwoofer?: string;
    compatibility?: string;
    weight?: string;
    frameRate?: string;
}

interface Product {
    id: number;
    image: string;
    title: string;
    rating: number;
    price: number;
    mrp?: number;
    discount?: number;
    description: string;
    category: string;
    brand: string;
    availability: string;
    features: string[];
    warranty: string;
    color: string;
    reviews: Review[];
    specifications: Specifications;
}

export const ProductsData: Product[] = [
    {
        id: 1,
        image: "/Products/Mouse.png",
        title: "Logitech G502 X Gaming Mouse (White)",
        rating: 4.0,
        price: 4700,
        mrp: 5900,
        discount: 30,
        description: "Experience precision and comfort with the Logitech G502 X gaming mouse. Features advanced sensor technology and customizable buttons.",
        category: "laptops",
        brand: "Logitech",
        availability: "In Stock",
        features: ["High DPI sensor", "Customizable buttons", "RGB lighting"],
        warranty: "2 years",
        color: "White",
        reviews: [
            { user: "Gamer123", rating: 4, comment: "Great mouse, very comfortable." },
            { user: "TechEnthusiast", rating: 5, comment: "Best gaming mouse I've ever used!" }
        ],
        specifications: {
            sensor: "HERO 25K",
            dpi: "25,600",
            connectivity: "Wired",
            buttons: "11 programmable buttons"
        }
    },
    {
        id: 2,
        image: "/Products/gaming-chair.png",
        title: "Razer DeathAdder V2 Gaming Mouse",
        rating: 4.5,
        price: 3200,
        mrp: 3999,
        discount: 20,
        description: "The Razer DeathAdder V2 offers high precision and ergonomic design, perfect for long gaming sessions.",
        category: "desktops",
        brand: "Razer",
        availability: "In Stock",
        features: ["Optical sensor", "Ergonomic design", "Programmable buttons"],
        warranty: "1 year",
        color: "Black",
        reviews: [
            { user: "GameMaster", rating: 5, comment: "Amazing precision and comfort." },
            { user: "MouseLover", rating: 4, comment: "Good mouse, but a bit heavy." }
        ],
        specifications: {
            sensor: "Razer Focus+",
            dpi: "20,000",
            connectivity: "Wired",
            buttons: "8 programmable buttons"
        }
    },
    {
        id: 3,
        image: "/Products/asus-tuf.png",
        title: "SteelSeries Rival 650 Wireless Gaming Mouse",
        rating: 4.3,
        price: 7500,
        mrp: 8999,
        discount: 15,
        description: "Enjoy wireless freedom with the SteelSeries Rival 650. Features fast charging and high precision tracking.",
        category: "components",
        brand: "SteelSeries",
        availability: "In Stock",
        features: ["Wireless connectivity", "Fast charging", "High precision sensor"],
        warranty: "2 years",
        color: "Black",
        reviews: [
            { user: "WirelessFan", rating: 4, comment: "Great wireless mouse, no lag." },
            { user: "GamerGuy", rating: 5, comment: "Love the fast charging feature!" }
        ],
        specifications: {
            sensor: "TrueMove3+",
            dpi: "12,000",
            connectivity: "Wireless",
            buttons: "7 programmable buttons"
        }
    },
    {
        id: 4,
        image: "/Products/Mouse.png",
        title: "Corsair Harpoon RGB Pro Gaming Mouse",
        rating: 3.8,
        price: 2500,
        mrp: 2999,
        discount: 16,
        description: "The Corsair Harpoon RGB Pro offers a comfortable grip and customizable RGB lighting for an immersive gaming experience.",
        category: "Peripherals",
        brand: "Corsair",
        availability: "In Stock",
        features: ["RGB lighting", "Comfortable grip", "High DPI sensor"],
        warranty: "2 years",
        color: "Black",
        reviews: [
            { user: "RGBLover", rating: 4, comment: "Nice RGB effects and comfortable to use." },
            { user: "BudgetGamer", rating: 3, comment: "Good for the price, but could be better." }
        ],
        specifications: {
            sensor: "Optical",
            dpi: "12,000",
            connectivity: "Wired",
            buttons: "6 programmable buttons"
        }
    },
    {
        id: 5,
        image: "/Products/gaming-chair.png",
        title: "HyperX Pulsefire Surge RGB Gaming Mouse",
        rating: 4.2,
        price: 3900,
        mrp: 4599,
        description: "The HyperX Pulsefire Surge features dynamic RGB lighting and a high-precision sensor for accurate tracking.",
        category: "Accessories",
        brand: "HyperX",
        availability: "In Stock",
        features: ["RGB lighting", "High precision sensor", "Ergonomic design"],
        warranty: "2 years",
        color: "Black",
        reviews: [
            { user: "HyperXFan", rating: 5, comment: "Excellent mouse, great RGB effects." },
            { user: "GamerGirl", rating: 4, comment: "Comfortable and precise, good buy!" }
        ],
        specifications: {
            sensor: "Pixart 3389",
            dpi: "16,000",
            connectivity: "Wired",
            buttons: "6 programmable buttons"
        }
    },
    // Append these to your existing ProductsData array

    {
        id: 6,
        image: "/Products/asus-tuf.png",
        title: "ASUS TUF Gaming M4 Wireless Mouse",
        rating: 4.1,
        price: 4200,
        mrp: 4999,
        discount: 16,
        description: "Lightweight and durable, the ASUS TUF M4 is built for precision and comfort during intense gaming sessions.",
        category: "components",
        brand: "ASUS",
        availability: "In Stock",
        features: ["Lightweight", "Water-resistant", "Low latency"],
        warranty: "2 years",
        color: "Black",
        reviews: [
            { user: "ASUSFan", rating: 4, comment: "Feels durable and responsive." },
            { user: "LightMouse", rating: 4, comment: "Super lightweight and accurate." }
        ],
        specifications: {
            sensor: "PAW3335",
            dpi: "16,000",
            connectivity: "Wireless",
            buttons: "6 programmable buttons"
        }
    },
    {
        id: 7,
        image: "/Products/Mouse.png",
        title: "Redragon M602 RGB Wired Gaming Mouse",
        rating: 3.9,
        price: 2200,
        mrp: 2999,
        discount: 27,
        description: "The Redragon M602 offers RGB lighting, ergonomic shape, and customizable buttons at an affordable price.",
        category: "Peripherals",
        brand: "Redragon",
        availability: "In Stock",
        features: ["RGB lighting", "Ergonomic shape", "Adjustable DPI"],
        warranty: "1 year",
        color: "Black",
        reviews: [
            { user: "BudgetWarrior", rating: 4, comment: "Great value for the price." },
            { user: "RGBFan", rating: 3, comment: "Lighting is decent, buttons could be better." }
        ],
        specifications: {
            sensor: "Optical",
            dpi: "7200",
            connectivity: "Wired",
            buttons: "7 programmable buttons"
        }
    },
    {
        id: 8,
        image: "/Products/gaming-chair.png",
        title: "Dragon War ELE-G9 Thor Gaming Mouse",
        rating: 4.0,
        price: 3100,
        mrp: 3499,
        discount: 11,
        description: "Enhance your gaming control with the Dragon War ELE-G9. Features high DPI and durable build.",
        category: "desktops",
        brand: "Dragon War",
        availability: "In Stock",
        features: ["Macro support", "High DPI", "Comfortable design"],
        warranty: "1 year",
        color: "Blue/Black",
        reviews: [
            { user: "ThorGamer", rating: 4, comment: "Impressive design and great for FPS games." },
            { user: "MacroMaster", rating: 4, comment: "Macros are easy to configure." }
        ],
        specifications: {
            sensor: "Optical",
            dpi: "3200",
            connectivity: "Wired",
            buttons: "8 programmable buttons"
        }
    },
    {
        id: 9,
        image: "/Products/asus-tuf.png",
        title: "Cooler Master MM711 RGB Gaming Mouse",
        rating: 4.3,
        price: 3500,
        mrp: 4200,
        discount: 17,
        description: "Ultra-lightweight and built for speed, the MM711 features honeycomb shell design and high precision tracking.",
        category: "components",
        brand: "Cooler Master",
        availability: "In Stock",
        features: ["Ultra-lightweight", "Honeycomb design", "RGB lighting"],
        warranty: "2 years",
        color: "White",
        reviews: [
            { user: "LightSpeed", rating: 5, comment: "So light and easy to glide." },
            { user: "CMFan", rating: 4, comment: "Good quality, perfect for fast-paced games." }
        ],
        specifications: {
            sensor: "PixArt 3389",
            dpi: "16,000",
            connectivity: "Wired",
            buttons: "6 programmable buttons"
        }
    },
    {
        id: 10,
        image: "/Products/Mouse.png",
        title: "Zebronics Zeb-Transformer-M Optical Gaming Mouse",
        rating: 3.7,
        price: 1300,
        mrp: 1499,
        discount: 13,
        description: "Affordable and stylish, this Zebronics mouse features a braided cable and LED lights.",
        category: "Accessories",
        brand: "Zebronics",
        availability: "In Stock",
        features: ["LED lights", "Braided cable", "Adjustable DPI"],
        warranty: "1 year",
        color: "Black/Red",
        reviews: [
            { user: "ZebFan", rating: 3, comment: "Budget friendly and works well." },
            { user: "StudentGamer", rating: 4, comment: "Great for casual gaming." }
        ],
        specifications: {
            sensor: "Optical",
            dpi: "3200",
            connectivity: "Wired",
            buttons: "6 buttons"
        }
    },
    {
        id: 11,
        image: "/Products/gaming-chair.png",
        title: "Lenovo Legion M300 RGB Gaming Mouse",
        rating: 4.0,
        price: 2900,
        mrp: 3500,
        discount: 17,
        description: "Built for gamers, this Lenovo mouse combines ergonomic design with responsive controls.",
        category: "laptops",
        brand: "Lenovo",
        availability: "In Stock",
        features: ["Ambidextrous design", "RGB lighting", "Ergonomic build"],
        warranty: "2 years",
        color: "Black",
        reviews: [
            { user: "LenovoFan", rating: 4, comment: "Nice grip and smooth performance." },
            { user: "RGBGamer", rating: 4, comment: "Lighting is cool, works great." }
        ],
        specifications: {
            sensor: "Optical",
            dpi: "8000",
            connectivity: "Wired",
            buttons: "8 programmable buttons"
        }
    },
    {
        id: 12,
        image: "/Products/asus-tuf.png",
        title: "Logitech G304 Lightspeed Wireless Gaming Mouse",
        rating: 4.4,
        price: 3500,
        mrp: 4299,
        discount: 18,
        description: "Enjoy pro-level performance with Logitech G304’s wireless Lightspeed tech and compact design.",
        category: "desktops",
        brand: "Logitech",
        availability: "In Stock",
        features: ["Lightspeed wireless", "Compact design", "Low-latency"],
        warranty: "2 years",
        color: "Blue",
        reviews: [
            { user: "LogitechPro", rating: 5, comment: "Best wireless gaming mouse in budget." },
            { user: "Speedy", rating: 4, comment: "Responsive and reliable." }
        ],
        specifications: {
            sensor: "HERO",
            dpi: "12,000",
            connectivity: "Wireless",
            buttons: "6 programmable buttons"
        }
    },
    {
        id: 13,
        image: "/Products/Mouse.png",
        title: "HP X900 Wired Optical Mouse",
        rating: 3.5,
        price: 600,
        mrp: 799,
        discount: 25,
        description: "Simple and effective, the HP X900 is a plug-and-play wired mouse suitable for everyday use.",
        category: "Peripherals",
        brand: "HP",
        availability: "In Stock",
        features: ["Ergonomic design", "Plug and play", "1000 DPI"],
        warranty: "1 year",
        color: "Black",
        reviews: [
            { user: "OfficeUser", rating: 3, comment: "Basic but works fine." },
            { user: "Minimalist", rating: 4, comment: "No fuss, just works." }
        ],
        specifications: {
            sensor: "Optical",
            dpi: "1000",
            connectivity: "Wired",
            buttons: "3 buttons"
        }
    },
    {
        id: 14,
        image: "/Products/gaming-chair.png",
        title: "MSI Clutch GM11 RGB Gaming Mouse",
        rating: 4.2,
        price: 2800,
        mrp: 3300,
        discount: 15,
        description: "The MSI GM11 combines sleek aesthetics with durable performance for an enhanced gaming experience.",
        category: "components",
        brand: "MSI",
        availability: "In Stock",
        features: ["RGB lighting", "Durable build", "Adjustable DPI"],
        warranty: "2 years",
        color: "Black",
        reviews: [
            { user: "MSIFan", rating: 5, comment: "Very smooth and precise." },
            { user: "Techie", rating: 4, comment: "RGB looks awesome, works well." }
        ],
        specifications: {
            sensor: "PixArt",
            dpi: "5000",
            connectivity: "Wired",
            buttons: "6 buttons"
        }
    },
    // Repeat similar style for 5 more products as needed...

];
