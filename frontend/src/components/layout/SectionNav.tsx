"use client";

import { useAppStore } from "@/store/useAppStore";
import type { ActiveSection } from "@/types";

const sections: { value: ActiveSection; label: string }[] = [
  { value: "appstore", label: "App Store" },
  { value: "trustpilot", label: "Trustpilot" },
  { value: "analysis", label: "Analysis" },
];

export function SectionNav() {
  const { activeSection, setActiveSection } = useAppStore();

  return (
    <div className="flex border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      {sections.map((s) => {
        const active = activeSection === s.value;
        return (
          <button
            key={s.value}
            onClick={() => setActiveSection(s.value)}
            className={`relative px-3 sm:px-4 py-3 text-sm transition-colors duration-150 -mb-px border-b-2 whitespace-nowrap min-h-[44px] ${
              active
                ? "border-text-primary text-text-primary font-semibold"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
