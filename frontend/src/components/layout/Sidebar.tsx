"use client";

import { useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AppMultiSelectPicker } from "@/components/shared/AppMultiSelectPicker";
import { useFetchReviews } from "@/hooks/useFetchReviews";

export function Sidebar({ onClose }: { onClose?: () => void } = {}) {
  const {
    selectedApps,
    setSelectedApps,
    countryCode,
    setCountryCode,
    fetchMode,
    setFetchMode,
    isFetching,
  } = useAppStore();

  const { fetch: fetchReviews } = useFetchReviews();

  const [months, setMonths] = useState(12);
  const [maxPages, setMaxPages] = useState(10);

  const MAX_FAST_PAGES = 10;

  const handleFetch = useCallback(() => {
    if (selectedApps.length === 0) return;
    const cutoffDays = fetchMode === "time" ? months * 30 : 365 * 10;
    const pages = fetchMode === "pages" ? maxPages : MAX_FAST_PAGES;
    fetchReviews(pages, cutoffDays);
    onClose?.();
  }, [selectedApps, fetchMode, months, maxPages, fetchReviews, onClose]);

  return (
    <aside className="w-[300px] shrink-0 bg-bg-secondary border-r border-border h-[100dvh] overflow-y-auto">
      {/* Header — brand title + optional close button (mobile drawer) */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-[28px] font-bold text-text-primary tracking-tight leading-none">App Reviewer</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.06)] transition-colors shrink-0 ml-2"
            aria-label="Close"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* App Search */}
      <div className="px-5 pb-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-4">
          App Store
        </h2>

        <label className="block text-[13px] font-medium text-text-primary mb-1.5">
          Country code
        </label>
        <input
          type="text"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
          placeholder="e.g. it, us"
        />

        <label className="block text-[13px] font-medium text-text-primary mb-1.5 mt-4">
          Source
        </label>
        <AppMultiSelectPicker
          selected={selectedApps}
          onChange={setSelectedApps}
          country={countryCode}
          placeholder="Select app"
        />

        {selectedApps.length > 0 && (
          <p className="mt-2 text-[11px] text-text-tertiary">
            {selectedApps.length === 1
              ? `1 app selected`
              : `${selectedApps.length} apps selected — fetching from first`}
          </p>
        )}
      </div>

      <div className="mx-5 border-t border-border" />

      {/* Fetch controls */}
      <div className="px-5 py-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-3">
          Fetch Mode
        </h2>
        <div className="flex gap-0.5 mb-4 bg-bg-primary rounded-pill p-1">
          <button
            onClick={() => setFetchMode("time")}
            className={`flex-1 py-2 text-xs font-medium rounded-pill transition-all duration-150 ${
              fetchMode === "time"
                ? "bg-text-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Time period
          </button>
          <button
            onClick={() => setFetchMode("pages")}
            className={`flex-1 py-2 text-xs font-medium rounded-pill transition-all duration-150 ${
              fetchMode === "pages"
                ? "bg-text-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Pages
          </button>
        </div>

        {fetchMode === "time" ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-medium text-text-primary">
                Months back
              </label>
              <span className="text-[13px] font-bold text-text-primary tabular-nums">{months}</span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full accent-text-primary"
            />
            <p className="mt-2 text-[11px] text-text-tertiary leading-relaxed">
              Fetches up to 10 pages (~500 reviews) within the selected time window.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Pages to fetch
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
            {maxPages > 10 && (
              <p className="mt-2 text-[11px] text-amber-600 leading-relaxed">
                ⚠ More than 10 pages may take longer to fetch.
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleFetch}
          disabled={selectedApps.length === 0 || isFetching}
          className="w-full py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97] disabled:bg-[rgba(0,0,0,0.06)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isFetching ? "Fetching..." : "Fetch Reviews"}
        </button>
      </div>
    </aside>
  );
}
