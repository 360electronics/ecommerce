"use client";

import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
}

interface CustomTabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export function CustomTabs({
  tabs,
  active,
  onChange,
}: CustomTabsProps) {
  return (
    <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1 bg-white w-fit">
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
