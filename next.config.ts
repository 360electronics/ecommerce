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
    ],
  },
};

export default nextConfig;
