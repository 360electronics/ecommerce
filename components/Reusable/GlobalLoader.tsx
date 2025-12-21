"use client";

import { Loader2 } from "lucide-react";

export default function GlobalLoader({
  label = "Please wait…",
}: {
  label?: string;
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-gray-700">{label}</p>
      </div>
    </div>
  );
}
