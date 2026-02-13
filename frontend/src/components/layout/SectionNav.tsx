"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useAppStore } from "@/store/useAppStore";
import type { ActiveSection } from "@/types";

const sections: { value: ActiveSection; label: string }[] = [
  { value: "appstore", label: "App Store" },
  { value: "trustpilot", label: "Trustpilot" },
  { value: "comparison", label: "Comparison" },
];

export function SectionNav() {
  const { activeSection, setActiveSection } = useAppStore();

  return (
    <Tabs.Root value={activeSection} onValueChange={(v) => setActiveSection(v as ActiveSection)}>
      <Tabs.List className="flex bg-bg-secondary rounded-pill p-1 gap-1 w-fit">
        {sections.map((s) => (
          <Tabs.Trigger
            key={s.value}
            value={s.value}
            className="px-6 py-2.5 text-sm font-medium rounded-pill transition-colors data-[state=active]:bg-[rgba(0,0,0,0.06)] data-[state=active]:text-text-primary data-[state=active]:font-semibold text-text-secondary hover:text-text-primary"
          >
            {s.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
