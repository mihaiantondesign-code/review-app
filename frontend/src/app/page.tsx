"use client";

import { useState, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SectionNav } from "@/components/layout/SectionNav";
import { AppStoreSection } from "@/components/sections/AppStoreSection";
import { TrustpilotSection } from "@/components/sections/TrustpilotSection";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { FeedbackModal, useFeedbackTrigger } from "@/components/shared/FeedbackModal";
import { useAppStore } from "@/store/useAppStore";

export default function Home() {
  const activeSection = useAppStore((s) => s.activeSection);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasFired = useRef(false);

  const showModal = () => setModalOpen(true);
  useFeedbackTrigger(showModal, hasFired);

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      {/* Desktop sidebar — always visible ≥ lg */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-primary sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-lg hover:bg-[rgba(0,0,0,0.05)] transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold text-text-primary tracking-tight">mihAI</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <SectionNav />
          <div className="mt-5">
            {activeSection === "appstore" && <AppStoreSection onDownload={showModal} />}
            {activeSection === "trustpilot" && <TrustpilotSection />}
            {activeSection === "comparison" && <ComparisonSection />}
          </div>
        </div>
      </main>

      {/* Feedback button */}
      <button
        onClick={showModal}
        className="fixed bottom-5 right-5 z-40 px-4 py-2 text-xs font-semibold text-white rounded-pill shadow-lg transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
        style={{ backgroundColor: "#FF2D78" }}
      >
        Feedback
      </button>

      <FeedbackModal show={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
