"use client";

import Sidebar from "@/components/Profile/Sidebar";
import { useProfileInitializer } from "../Profile/ProfileInitializer";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize profile data
  useProfileInitializer();

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
