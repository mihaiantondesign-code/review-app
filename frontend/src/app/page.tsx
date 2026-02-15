"use client";

import { useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SectionNav } from "@/components/layout/SectionNav";
import { AppStoreSection } from "@/components/sections/AppStoreSection";
import { TrustpilotSection } from "@/components/sections/TrustpilotSection";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { AppMultiSelectPicker } from "@/components/shared/AppMultiSelectPicker";
import { FeedbackModal, useFeedbackTrigger } from "@/components/shared/FeedbackModal";
import { useAppStore } from "@/store/useAppStore";
import { useFetchReviews } from "@/hooks/useFetchReviews";

// ─── Mobile onboarding hero (shown on mobile before first fetch) ──────────────

function MobileOnboarding({ onOpenSidebar }: { onOpenSidebar: () => void }) {
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
  }, [selectedApps, fetchMode, months, maxPages, fetchReviews]);

  return (
    <div className="flex flex-col min-h-[100dvh] px-6 pt-14 pb-10 bg-bg-primary">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-[36px] font-bold text-text-primary tracking-tight leading-none mb-2">
          App Reviewer
        </h1>
        <p className="text-[15px] text-text-secondary leading-relaxed">
          Fetch and analyse App Store reviews in seconds.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5 flex-1">
        {/* Country */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Country</label>
          <input
            type="text"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            placeholder="e.g. it, us, gb"
            className="w-full px-4 py-3 text-[15px] border border-border-strong rounded-xl bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
          />
        </div>

        {/* App picker */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">App</label>
          <AppMultiSelectPicker
            selected={selectedApps}
            onChange={setSelectedApps}
            country={countryCode}
            placeholder="Search app name…"
          />
        </div>

        {/* Mode toggle */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Fetch mode</label>
          <div className="flex gap-0.5 bg-bg-secondary rounded-pill p-1">
            {(["time", "pages"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFetchMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-pill transition-all duration-150 ${
                  fetchMode === m
                    ? "bg-text-primary text-white shadow-sm"
                    : "text-text-secondary"
                }`}
              >
                {m === "time" ? "Time period" : "Pages"}
              </button>
            ))}
          </div>
        </div>

        {/* Slider / number */}
        {fetchMode === "time" ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-text-primary">Months back</label>
              <span className="text-[15px] font-bold text-text-primary tabular-nums">{months}</span>
            </div>
            <input
              type="range" min={1} max={24} value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full accent-text-primary"
            />
          </div>
        ) : (
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">Pages to fetch</label>
            <input
              type="number" min={1} max={50} value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="w-full px-4 py-3 text-[15px] border border-border-strong rounded-xl bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-8 space-y-3">
        <button
          onClick={handleFetch}
          disabled={selectedApps.length === 0 || isFetching}
          className="w-full py-4 text-[15px] font-semibold text-white bg-text-primary rounded-2xl transition-all duration-150 active:scale-[0.98] disabled:bg-[rgba(0,0,0,0.08)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed shadow-sm"
        >
          {isFetching ? "Fetching…" : "Fetch Reviews"}
        </button>
        <button
          onClick={onOpenSidebar}
          className="w-full py-3 text-[13px] font-medium text-text-secondary rounded-2xl hover:bg-[rgba(0,0,0,0.04)] transition-colors"
        >
          Advanced options
        </button>
      </div>
    </div>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────

export default function Home() {
  const { activeSection, reviews, fetchDone, isFetching } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasFired = useRef(false);

  const showModal = () => setModalOpen(true);
  useFeedbackTrigger(showModal, hasFired);

  // Show mobile onboarding when: on appstore tab, no results yet, not currently fetching
  const showMobileOnboarding =
    activeSection === "appstore" && reviews.length === 0 && !fetchDone && !isFetching;

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

        {/* Mobile onboarding — fullscreen, no top bar, no tabs */}
        {showMobileOnboarding && (
          <div className="lg:hidden">
            <MobileOnboarding onOpenSidebar={() => setSidebarOpen(true)} />
          </div>
        )}

        {/* Normal layout — always shown on desktop, shown on mobile after first fetch */}
        <div className={showMobileOnboarding ? "hidden lg:block" : ""}>
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
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">App Reviewer</span>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <SectionNav />
            <div className="mt-5">
              {activeSection === "appstore" && <AppStoreSection onDownload={showModal} />}
              {activeSection === "trustpilot" && <TrustpilotSection />}
              {activeSection === "comparison" && <ComparisonSection />}
            </div>
          </div>
        </div>
      </main>

      {/* Feedback button — hide on onboarding screen */}
      {!showMobileOnboarding && (
        <button
          onClick={showModal}
          className="fixed bottom-5 right-5 z-40 px-4 py-2 text-xs font-semibold text-white rounded-pill shadow-lg transition-all duration-150 hover:opacity-90 active:scale-[0.97] lg:block"
          style={{ backgroundColor: "#FF2D78" }}
        >
          Feedback
        </button>
      )}

      <FeedbackModal show={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
