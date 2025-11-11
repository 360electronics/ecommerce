
// Generic normalizer: Applies to all string attrs
const normalizeGeneric = (value: string): string => {
  if (!value || typeof value !== "string") return "";

  // Remove invisible Unicode + accents + excessive spacing
  let cleaned = value
    .normalize("NFD") // split accents from letters
    .replace(/\p{Diacritic}/gu, "") // remove accents
    .replace(/[\u200B-\u200D\u200E\u200F\uFEFF]/g, "") // invisible chars
    .replace(/\s+/g, " ") // collapse spaces
    .trim()
    .toLowerCase();

  // Remove content in parentheses
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, "").trim();

  // Capitalize each word
  return cleaned
    .split(" ")
    .map((word) =>
      word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ""
    )
    .join(" ");
};

// Specific normalizers: Extend for attrs needing custom logic
const normalizers: Record<string, (val: string) => string> = {
  // Display Size: Extract num + "inches" (assume inches; convert cm if needed)
  "Display Size": (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    const numMatch = generic.match(/(\d+(?:\.\d+)?)/);
    if (!numMatch) return generic;
    const num = numMatch[1];
    if (generic.includes("cm") || generic.includes("centimetre")) {
      // Convert to inches: 1 cm ≈ 0.3937 in
      const inches = (parseFloat(num) * 0.3937).toFixed(1);
      return `${inches} Inches`;
    }
    // Default to inches if no unit
    return generic.includes("inch") ? generic : `${num} Inches`;
  },

  // Processor: Keep model intact after generic cleanup (e.g., "Intel Core i3")
  Processor: (value: string) => {
    const generic = normalizeGeneric(value);
    // Ensure specific processor naming conventions
    return generic
      .replace(/intel core i(\d)/, "Intel Core i$1")
      .replace(/amd ryzen (\d)/, "AMD Ryzen $1")
      .replace(/apple m(\d)/, "Apple M$1");
  },

  // Cpu: Standardize CPU names for Processors
  Cpu: (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    const cpuMap: Record<string, string> = {
      "amd athlon": "AMD Athlon",
      "ryzen 3": "AMD Ryzen 3",
      "ryzen 5": "AMD Ryzen 5",
      "ryzen 7": "AMD Ryzen 7",
      "ryzen 9": "AMD Ryzen 9",
      "intel i3": "Intel Core i3",
      "intel i5": "Intel Core i5",
      "intel i7": "Intel Core i7",
      "intel i9": "Intel Core i9",
      "intel ultra 5": "Intel Ultra 5",
      "intel ultra 7": "Intel Ultra 7",
      "intel ultra 9": "Intel Ultra 9",
    };
    return cpuMap[generic] || normalizeGeneric(value);
  },

  // Storage: Extract num + "gb" or "tb" (ignore "ssd"/"hdd")
  Storage: (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    const numMatch = generic.match(/(\d+(?:\.\d+)?)\s*(tb|gb)/i);
    if (numMatch) {
      const [_, num, unit] = numMatch;
      return `${num} ${unit.toUpperCase()}`;
    }
    // Fallback: Assume GB if just num
    const numOnly = generic.match(/(\d+(?:\.\d+)?)/);
    return numOnly ? `${numOnly[1]} GB` : generic;
  },

  // RAM: Similar to storage, num + "gb"
  RAM: (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    const numMatch = generic.match(/(\d+(?:\.\d+)?)\s*(gb)/i);
    if (numMatch) return `${numMatch[1]} GB`;
    const numOnly = generic.match(/(\d+(?:\.\d+)?)/);
    return numOnly ? `${numOnly[1]} GB` : generic;
  },

  // Operating System: Clean but keep specifics (e.g., "Windows 11 Home")
  "Operating System": (value: string) => {
    const generic = normalizeGeneric(value);
    return generic
      .replace(/windows (\d+)/, "Windows $1")
      .replace(/macos/, "macOS")
      .replace(/linux/, "Linux");
  },

  // Graphics: Handle graphics card models and types
  Graphics: (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();

    // Detect and standardize types
    if (generic.includes("integrated")) {
      return "Integrated Graphics";
    }
    if (generic.includes("dedicated")) {
      return "Dedicated Graphics";
    }

    // Handle specific graphics card models
    const modelMatch = generic.match(
      /(nvidia|amd|intel)?\s*(geforce|radeon|arc)?\s*(rtx|gtx|rx|arc)\s*(\d+[a-z]*)/i
    );
    if (modelMatch) {
      const [_, vendor = "", series = "", family, model] = modelMatch;
      const normalizedVendor = vendor ? normalizeGeneric(vendor) : "";
      const normalizedSeries = series ? normalizeGeneric(series) : "";
      return `${normalizedVendor} ${normalizedSeries} ${family.toUpperCase()} ${model.toLowerCase()}`.trim();
    }

    // Fallback to generic
    return normalizeGeneric(value);
  },

  // Brand: Standardize brand names for Graphics Card
  Brand: (value: string) => {
    if (!value) return "";

    // ✅ Step 1: Normalize case, trim, and remove accents
    const lower = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();

    // ✅ Step 2: Canonical brand mappings
    const brandMap: Record<string, string> = {
      asrock: "ASRock",
      asus: "ASUS",
      galax: "Galax",
      gigabyte: "GIGABYTE",
      inno3d: "Inno3D",
      msi: "MSI",
      hp: "HP",
      dell: "Dell",
      lenovo: "Lenovo",
      acer: "Acer",
      lg: "LG",
      samsung: "Samsung",
      benq: "BenQ",
      logitech: "Logitech",
      razer: "Razer",
      corsair: "Corsair",
      canon: "Canon",
      intel: "Intel",
      amd: "AMD",
      nvidia: "NVIDIA",
    };

    // ✅ Step 3: Return mapped name or capitalized fallback
    if (brandMap[lower]) return brandMap[lower];

    return lower.charAt(0).toUpperCase() + lower.slice(1);
  },

  // Series: Normalize Graphics Card series
  Series: (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    // Standardize series naming
    const seriesMap: Record<string, string> = {
      "gt 1000 series": "GT 1000 Series",
      "gt 700 series": "GT 700 Series",
      "rtx 3000 series": "RTX 3000 Series",
      "rtx 5000 series": "RTX 5000 Series",
      "rx 500 series": "RX 500 Series",
      "rx 7000 series": "RX 7000 Series",
      "rx 9000 series": "RX 9000 Series",
      "amd 3000 series": "AMD 3000 Series",
      "amd 4000 series": "AMD 4000 Series",
      "amd 5000 series": "AMD 5000 Series",
      "amd 7000 series": "AMD 7000 Series",
      "amd 8000 series": "AMD 8000 Series",
      "amd 9000 series": "AMD 9000 Series",
      "intel 10th gen": "Intel 10th Gen",
      "intel 11th gen": "Intel 11th Gen",
      "intel 12th gen": "Intel 12th Gen",
      "intel 13th gen": "Intel 13th Gen",
      "intel 14th gen": "Intel 14th Gen",
    };
    return seriesMap[generic] || normalizeGeneric(value);
  },

  // Memory Type: Standardize memory types for Graphics Card
  "Memory Type": (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    const memoryMap: Record<string, string> = {
      ddr3: "DDR3",
      "ddr3 sdram": "DDR3",
      gddr3: "GDDR3",
      gddr5: "GDDR5",
      gddr6: "GDDR6",
      gddr6x: "GDDR6X",
      gddr7: "GDDR7",
    };
    return memoryMap[generic] || normalizeGeneric(value);
  },

  Display: (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    const displayMap: Record<string, string> = {
      "fhd 1080": "FHD 1920x1080",
      "fhd 1080p": "FHD 1920x1080",
      fhd1080: "FHD 1920x1080",
      "fhd ultra wide 1080p": "FHD Ultra Wide 2560x1080",
      wfhd: "FHD Ultra Wide 2560x1080",
      "wfhd 2160 x 1080p": "FHD Ultra Wide 2560x1080",
      hd: "HD 1280x720",
      "hd+": "HD+ 1600x900",
      qhd: "QHD 2560x1440",
      "qhd 1440": "QHD 2560x1440",
      "qhd 1440p": "QHD 2560x1440",
      "qhd 2560 x 1440p": "QHD 2560x1440",
      "qhd 2kp": "QHD 2560x1440",
      "qhd ultra wide 1440p": "QHD Ultra Wide 3440x1440",
      "qhd wide 1440p": "QHD Ultra Wide 3440x1440",
      wqhd: "WQHD 3440x1440",
      "wqhd 1440p": "WQHD 3440x1440",
      "wqhd 3440 x 1440p": "WQHD 3440x1440",
      "wqhd 3840 x 1600": "WQHD 3840x1600",
      uhd: "UHD 2560x1600",
      "uhd 1440p": "UHD 2560x1600",
      "uhd 1600p": "UHD 2560x1600",
      "uhd 2160p": "4K UHD 3840x2160",
      "uhd 3840x2160": "4K UHD 3840x2160",
      "4k uhd 2160p": "4K UHD 3840x2160",
      "4k 3840 x 2160": "4K UHD 3840x2160",
      "4k dci 2160p": "4K UHD 3840x2160",
      "uwqhd 3440x1440p": "QHD Ultra Wide 3440x1440",
      "5k qhd 1440p": "5K QHD 5120x2880",
    };
    return displayMap[generic] || normalizeGeneric(value);
  },

  "Screen Size": (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    const numMatch = generic.match(/(\d+(?:\.\d+)?)/);
    if (!numMatch) return generic;
    const num = numMatch[1];
    if (generic.includes("cm") || generic.includes("centimetre")) {
      // Convert to inches: 1 cm ≈ 0.3937 in
      const inches = (parseFloat(num) * 0.3937).toFixed(1);
      return `${inches} Inches`;
    }
    // Standardize to "Inches" (handle "inch", "inches", "Inchs", etc.)
    return `${num} Inches`;
  },

  // Chipset: Standardize chipset names for Graphics Card
  Chipset: (value: string) => {
    const generic = normalizeGeneric(value).toLowerCase();
    const chipsetMap: Record<string, string> = {
      "amd radeon": "AMD Radeon",
      "nvidia geforce": "NVIDIA GeForce",
      "nvidia gevforce": "NVIDIA GeForce",
      "nvidia gefoce": "NVIDIA GeForce",
      "nvidia quadro": "NVIDIA Quadro",
    };
    return chipsetMap[generic] || normalizeGeneric(value);
  },
};

// Helper to get normalizer for a key (with fallback)
const getNormalizer = (key: string) => normalizers[key] || normalizeGeneric;

export { getNormalizer };