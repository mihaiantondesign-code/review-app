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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

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
      onProgress: (data) => setFetchProgress(data),
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
    <aside className="w-[300px] shrink-0 bg-bg-secondary border-r border-border h-screen overflow-y-auto">
      {/* App Search — primary section, gets more visual weight */}
      <div className="px-5 pt-6 pb-4">
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
          className="w-full px-3 py-2.5 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
          placeholder="e.g. it, us"
        />

        <label className="block text-[13px] font-medium text-text-primary mb-1.5 mt-4">
          Search App
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!e.target.value.trim()) setSelectedApp(null);
          }}
          className="w-full px-3 py-2.5 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
          placeholder="e.g. WhatsApp, Instagram..."
        />

        {selectedApp ? (
          <div className="mt-3">
            <AppCard app={selectedApp} selected />
            <button
              onClick={() => {
                setSelectedApp(null);
                setSearchQuery("");
              }}
              className="mt-2 w-full py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.07)] active:scale-[0.98] rounded-pill transition-all duration-150"
            >
              Change app
            </button>
          </div>
        ) : (
          searchQuery.trim() && (
            <div className="mt-3">
              {isSearching ? (
                <p className="text-xs text-text-tertiary py-2">Searching...</p>
              ) : (
                <AppSearchResults
                  results={searchResults}
                  onSelect={(app) => {
                    setSelectedApp(app);
                    setSearchQuery(app.name);
                  }}
                />
              )}
            </div>
          )
        )}
      </div>

      <div className="mx-5 border-t border-border" />

      {/* Fetch controls — secondary section, less weight */}
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
              className="w-full px-3 py-2.5 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
          </div>
        )}

        <button
          onClick={handleFetch}
          disabled={!selectedApp || isFetching}
          className="w-full py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97] disabled:bg-[rgba(0,0,0,0.06)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isFetching ? "Fetching..." : "Fetch Reviews"}
        </button>
      </div>
    </aside>
  );
}
