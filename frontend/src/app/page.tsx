"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { SectionNav } from "@/components/layout/SectionNav";
import { AppStoreSection } from "@/components/sections/AppStoreSection";
import { TrustpilotSection } from "@/components/sections/TrustpilotSection";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { useAppStore } from "@/store/useAppStore";

export default function Home() {
  const activeSection = useAppStore((s) => s.activeSection);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <SectionNav />
        <div className="mt-6">
          {activeSection === "appstore" && <AppStoreSection />}
          {activeSection === "trustpilot" && <TrustpilotSection />}
          {activeSection === "comparison" && <ComparisonSection />}
        </div>
      </main>
    </div>
  );
}
