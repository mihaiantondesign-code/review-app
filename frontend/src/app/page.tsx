"use client";

import { useState, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SectionNav } from "@/components/layout/SectionNav";
import { AppStoreSection } from "@/components/sections/AppStoreSection";
import { TrustpilotSection } from "@/components/sections/TrustpilotSection";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { FeedbackModal, useFeedbackTrigger } from "@/components/shared/FeedbackModal";
import { useAppStore } from "@/store/useAppStore";

const TALLY_URL = "https://tally.so/r/vGyoMA";

export default function Home() {
  const activeSection = useAppStore((s) => s.activeSection);
  const [modalOpen, setModalOpen] = useState(false);
  const hasFired = useRef(false);

  const showModal = () => setModalOpen(true);

  useFeedbackTrigger(showModal, hasFired);

  const handleModalClose = () => setModalOpen(false);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <SectionNav />
        <div className="mt-6">
          {activeSection === "appstore" && (
            <AppStoreSection onDownload={showModal} />
          )}
          {activeSection === "trustpilot" && <TrustpilotSection />}
          {activeSection === "comparison" && <ComparisonSection />}
        </div>
      </main>

      {/* Persistent feedback button — bottom left */}
      <a
        href={TALLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 left-5 z-40 px-4 py-2 text-xs font-semibold text-white rounded-pill shadow-lg transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
        style={{ backgroundColor: "#FF2D78" }}
      >
        Feedback
      </a>

      <FeedbackModal show={modalOpen} onClose={handleModalClose} />
    </div>
  );
}
