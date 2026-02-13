"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { searchApps, getAppStoreSSEUrl } from "@/lib/api";
import { consumeSSE } from "@/lib/sse";
import { AppSearchResults } from "@/components/shared/AppSearchResults";
import { AppCard } from "@/components/shared/AppCard";
import type { AppSearchResult } from "@/types";

export function Sidebar() {
  const {
    selectedApp,
    setSelectedApp,
    countryCode,
    setCountryCode,
    fetchMode,
    setFetchMode,
    setReviews,
    setFetchDone,
    setFetchProgress,
    setIsFetching,
    isFetching,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AppSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [months, setMonths] = useState(12);
  const [maxPages, setMaxPages] = useState(10);
  const abortRef = useRef<(() => void) | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // If it's a numeric ID, auto-select
    if (searchQuery.trim().match(/^\d+$/)) {
      setSelectedApp({
        id: searchQuery.trim(),
        name: `App ${searchQuery.trim()}`,
        developer: "",
        icon: "",
        bundle: "",
        price: "Free",
        rating: 0,
        ratings_count: 0,
      });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchApps(searchQuery.trim(), countryCode || "us");
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, countryCode, setSelectedApp]);

  const handleFetch = useCallback(() => {
    if (!selectedApp) return;

    const cutoffDays = fetchMode === "time" ? months * 30 : 365 * 10;
    const pages = fetchMode === "pages" ? maxPages : 50;

    setIsFetching(true);
    setFetchDone(false);
    setReviews([]);

    const url = getAppStoreSSEUrl(selectedApp.id, countryCode, pages, cutoffDays);

    abortRef.current = consumeSSE(url, {
      onProgress: (data) => {
        setFetchProgress(data);
      },
      onComplete: (data) => {
        setReviews(data.reviews);
        setFetchDone(true);
        setIsFetching(false);
        setFetchProgress(null);
      },
      onError: (data) => {
        console.error("SSE error:", data.message);
        setFetchDone(true);
        setIsFetching(false);
        setFetchProgress(null);
      },
    });
  }, [selectedApp, countryCode, fetchMode, months, maxPages, setIsFetching, setFetchDone, setReviews, setFetchProgress]);

  return (
    <aside className="w-[300px] shrink-0 bg-bg-secondary border-r border-border h-screen overflow-y-auto p-5">
      <div className="mb-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-secondary mb-2">
          App Store
        </h2>

        <label className="block text-[13px] font-medium text-text-primary mb-1">
          Country
        </label>
        <input
          type="text"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
          placeholder="e.g. it, us"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[13px] font-medium text-text-primary mb-1">
          Search App
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!e.target.value.trim()) setSelectedApp(null);
          }}
          className="w-full px-3 py-2 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
          placeholder="e.g. WhatsApp, Instagram..."
        />
      </div>

      {selectedApp ? (
        <div className="mb-4">
          <AppCard app={selectedApp} selected />
          <button
            onClick={() => {
              setSelectedApp(null);
              setSearchQuery("");
            }}
            className="mt-2 w-full py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-[rgba(0,0,0,0.04)] rounded-pill transition-colors"
          >
            Change app
          </button>
        </div>
      ) : (
        searchQuery.trim() && (
          <div className="mb-4">
            {isSearching ? (
              <p className="text-xs text-text-secondary">Searching...</p>
            ) : (
              <AppSearchResults results={searchResults} onSelect={(app) => {
                setSelectedApp(app);
                setSearchQuery(app.name);
              }} />
            )}
          </div>
        )
      )}

      <hr className="border-t border-border my-4" />

      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-secondary mb-2">
        Fetch Mode
      </h2>
      <div className="flex gap-1 mb-3 bg-bg-primary rounded-pill p-0.5">
        <button
          onClick={() => setFetchMode("time")}
          className={`flex-1 py-2 text-xs font-medium rounded-pill transition-colors ${
            fetchMode === "time"
              ? "bg-[rgba(0,0,0,0.06)] text-text-primary font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Time period
        </button>
        <button
          onClick={() => setFetchMode("pages")}
          className={`flex-1 py-2 text-xs font-medium rounded-pill transition-colors ${
            fetchMode === "pages"
              ? "bg-[rgba(0,0,0,0.06)] text-text-primary font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Pages
        </button>
      </div>

      {fetchMode === "time" ? (
        <div className="mb-4">
          <label className="block text-[13px] font-medium text-text-primary mb-1">
            Months back: {months}
          </label>
          <input
            type="range"
            min={1}
            max={24}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full accent-text-primary"
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-[13px] font-medium text-text-primary mb-1">
            Pages to fetch
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
          />
        </div>
      )}

      <button
        onClick={handleFetch}
        disabled={!selectedApp || isFetching}
        className="w-full py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all hover:bg-black hover:shadow-md disabled:bg-[rgba(0,0,0,0.06)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed"
      >
        {isFetching ? "Fetching..." : "Fetch Reviews"}
      </button>
    </aside>
  );
}
