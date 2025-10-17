import localFont from "next/font/local";
import { Inter } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const gotham = localFont({
  src: [
    {
      path: "../public/fonts/Gotham-Book.otf",
      weight: "400",
      style: "book",
    },
    {
      path: "../public/fonts/Gotham-Medium.otf",
      weight: "500",
      style: "medium",
    },
  ],
});

export const noHemi = localFont({
  src: [
    {
      path: "../public/fonts/Nohemi-Bold.otf",
      weight: "700",
      style: "bold",
    },
    {
      path: "../public/fonts/Nohemi-SemiBold.otf",
      weight: "600",
      style: "semibold",
    },
  ],
});
