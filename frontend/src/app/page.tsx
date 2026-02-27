"use client";

import { useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SectionNav } from "@/components/layout/SectionNav";
import { AppStoreSection } from "@/components/sections/AppStoreSection";
import { TrustpilotSection } from "@/components/sections/TrustpilotSection";
import { AnalysisSection } from "@/components/sections/AnalysisSection";
import { AppMultiSelectPicker } from "@/components/shared/AppMultiSelectPicker";
import { CountryField } from "@/components/shared/CountryField";
import { FeedbackModal, useFeedbackTrigger } from "@/components/shared/FeedbackModal";
import { useAppStore } from "@/store/useAppStore";
import { useFetchReviews } from "@/hooks/useFetchReviews";

// ─── Mobile search/config screen ─────────────────────────────────────────────
// Shown on mobile only, before first fetch or when user taps "Change App"

function MobileSearchScreen({ onDone }: { onDone: () => void }) {
  const {
    selectedApps, setSelectedApps,
    countryCode, setCountryCode,
    fetchMode, setFetchMode,
    isFetching,
  } = useAppStore();

  const { fetch: fetchReviews } = useFetchReviews();
  const [months, setMonths] = useState(12);
  const [maxPages, setMaxPages] = useState(10);

  const handleFetch = useCallback(() => {
    if (selectedApps.length === 0) return;
    const cutoffDays = fetchMode === "time" ? months * 30 : 365 * 10;
    const pages = fetchMode === "pages" ? maxPages : 10;
    fetchReviews(pages, cutoffDays);
    onDone();
  }, [selectedApps, fetchMode, months, maxPages, fetchReviews, onDone]);

  return (
    <div className="flex flex-col min-h-[100dvh] px-6 pt-14 pb-10 bg-bg-primary">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-[36px] font-bold text-text-primary tracking-tight leading-none mb-3">
          App Reviewer
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          Fetch and analyse App Store reviews in seconds.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6 flex-1">
        <div>
          <label className="block text-base font-semibold text-text-primary mb-2">Country</label>
          <CountryField value={countryCode} onChange={setCountryCode} size="lg" />
        </div>

        <div>
          <label className="block text-base font-semibold text-text-primary mb-2">App</label>
          <AppMultiSelectPicker
            selected={selectedApps}
            onChange={setSelectedApps}
            country={countryCode}
            placeholder="Search app name…"
          />
        </div>

        <div>
          <label className="block text-base font-semibold text-text-primary mb-2">Fetch mode</label>
          <div className="flex gap-1 bg-bg-secondary rounded-xl p-1">
            {(["time", "pages"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFetchMode(m)}
                className={`flex-1 py-2.5 text-[15px] font-medium rounded-lg transition-all duration-150 ${
                  fetchMode === m ? "bg-text-primary text-white shadow-sm" : "text-text-secondary"
                }`}
              >
                {m === "time" ? "Time period" : "Pages"}
              </button>
            ))}
          </div>
        </div>

        {fetchMode === "time" ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-base font-semibold text-text-primary">Months back</label>
              <span className="text-[22px] font-bold text-text-primary tabular-nums">{months}</span>
            </div>
            <input
              type="range" min={1} max={24} value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full accent-text-primary h-2"
            />
          </div>
        ) : (
          <div>
            <label className="block text-base font-semibold text-text-primary mb-2">Pages to fetch</label>
            <input
              type="number" min={1} max={50} value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="w-full px-4 py-3.5 min-h-[44px] text-base border border-border-strong rounded-xl bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-10 space-y-3">
        <button
          onClick={handleFetch}
          disabled={selectedApps.length === 0 || isFetching}
          className="w-full py-4 text-[17px] font-semibold text-white bg-text-primary rounded-2xl transition-all duration-150 active:scale-[0.98] disabled:bg-[rgba(0,0,0,0.08)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed"
        >
          {isFetching ? "Fetching…" : "Fetch Reviews"}
        </button>
      </div>
    </div>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────

export default function Home() {
  const { activeSection, fetchDone, isFetching } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  // Controls whether mobile search screen is shown (always true before first fetch)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(true);
  const hasFired = useRef(false);

  const showModal = () => setModalOpen(true);
  useFeedbackTrigger(showModal, hasFired);

  // Show search screen on mobile when explicitly opened (initial load or "Change app" tap)
  // Remove reviews.length guard so it works even after a fetch
  const showMobileSearch =
    mobileSearchOpen && activeSection === "appstore" && !isFetching;

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      {/* Desktop sidebar — always visible ≥ lg */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">

        {/* Mobile search screen — fullscreen, no chrome */}
        {showMobileSearch && (
          <div className="lg:hidden">
            <MobileSearchScreen onDone={() => setMobileSearchOpen(false)} />
          </div>
        )}

        {/* Results layout — desktop always, mobile after fetch */}
        <div className={showMobileSearch ? "hidden lg:block" : ""}>
          {/* Mobile top bar */}
          <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-bg-primary">
            <span className="text-[17px] font-bold text-text-primary tracking-tight">App Reviewer</span>
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="flex items-center gap-1.5 py-2 px-3.5 text-[13px] font-semibold bg-bg-secondary rounded-xl active:scale-[0.97] transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              Change app
            </button>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <SectionNav />
            <div className="mt-5">
              {activeSection === "appstore" && <AppStoreSection onDownload={showModal} />}
              {activeSection === "trustpilot" && <TrustpilotSection />}
              {activeSection === "analysis" && <AnalysisSection />}
            </div>
          </div>
        </div>
      </main>

      {/* Feedback button — hidden on mobile search screen */}
      {!showMobileSearch && (
        <button
          onClick={showModal}
          className="fixed bottom-5 right-5 z-40 px-4 py-2 text-sm font-semibold text-white rounded-pill shadow-lg transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: "#FF2D78" }}
        >
          Feedback
        </button>
      )}

      <FeedbackModal show={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
