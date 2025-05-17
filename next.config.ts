// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https", 
        hostname: "img.icons8.com",
      },
      {
        protocol: "https", 
        hostname: "press.asus.com",
      },
      {
        protocol: "https", 
        hostname: "1000logos.net",
      },
      {
        protocol: "https", 
        hostname: "img.freepik.com",
      },
      {
        protocol: "https", 
        hostname: "pub-24a64e6c279d47a78e0cfeb74ea9ab44.r2.dev",
      },
      {
        protocol: "https", 
        hostname: "assets.360electronics.in",
      },
    ],
  },
};

export default nextConfig;
