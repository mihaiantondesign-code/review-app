"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAppSearch } from "@/hooks/useAppSearch";
import { AppCard } from "./AppCard";
import type { AppSearchResult } from "@/types";

// 3-dot bouncing animation for "Searching..." state
function SearchingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-text-tertiary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

interface AppMultiSelectPickerProps {
  selected: AppSearchResult[];
  onChange: (apps: AppSearchResult[]) => void;
  country: string;
  placeholder?: string;
  /** When set to 1, behaves as single-select (for ComparisonSection slots) */
  max?: number;
}

export function AppMultiSelectPicker({
  selected,
  onChange,
  country,
  placeholder = "Select app",
  max,
}: AppMultiSelectPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isSearching } = useAppSearch(query, country);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const isChecked = useCallback(
    (app: AppSearchResult) => selected.some((s) => s.id === app.id),
    [selected]
  );

  const toggle = useCallback(
    (app: AppSearchResult) => {
      if (max === 1) {
        // Single-select mode: replace selection and close
        onChange([app]);
        setOpen(false);
        setQuery("");
        return;
      }
      if (isChecked(app)) {
        onChange(selected.filter((s) => s.id !== app.id));
      } else {
        if (max && selected.length >= max) return;
        onChange([...selected, app]);
      }
    },
    [selected, onChange, isChecked, max]
  );

  const allVisible = results.length > 0 && results.every((r) => isChecked(r));
  const toggleAll = () => {
    if (allVisible) {
      // Uncheck all visible
      const visibleIds = new Set(results.map((r) => r.id));
      onChange(selected.filter((s) => !visibleIds.has(s.id)));
    } else {
      // Check all visible (respecting max)
      const toAdd = results.filter((r) => !isChecked(r));
      const next = [...selected, ...toAdd];
      onChange(max ? next.slice(0, max) : next);
    }
  };

  // Trigger label
  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0].name
      : `${selected.length} apps selected`;

  return (
    <div ref={containerRef} className="relative">
      {/* Collapsed trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[44px] text-sm border rounded-sm bg-bg-primary transition-all duration-150 ${
          open
            ? "border-accent ring-2 ring-accent/15"
            : "border-border-strong hover:border-accent/50"
        }`}
      >
        <span className={selected.length === 0 ? "text-text-tertiary" : "text-text-primary font-medium truncate"}>
          {triggerLabel}
        </span>
        <svg
          className={`shrink-0 w-4 h-4 text-text-tertiary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-bg-primary border border-border rounded-sm shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  // Numeric ID direct-select
                  const val = e.target.value;
                  setQuery(val);
                  if (val.trim().match(/^\d+$/) && val.trim().length > 5) {
                    const syntheticApp: AppSearchResult = {
                      id: val.trim(),
                      name: `App ${val.trim()}`,
                      developer: "",
                      icon: "",
                      bundle: "",
                      price: "Free",
                      rating: 0,
                      ratings_count: 0,
                    };
                    toggle(syntheticApp);
                    setQuery("");
                  }
                }}
                placeholder="Search apps..."
                className="w-full px-2.5 min-h-[44px] text-sm bg-bg-secondary rounded-sm outline-none text-text-primary placeholder-text-tertiary"
              />
              {isSearching && (
                <div className="absolute inset-0 flex items-center px-2.5 pointer-events-none bg-bg-secondary rounded-sm">
                  <span className="text-sm text-text-tertiary flex items-center">
                    Searching<SearchingDots />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-[280px] overflow-y-auto">
            {/* Select all row — only in multi-select mode with results */}
            {!max || max > 1 ? (
              results.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[12px] font-semibold text-text-secondary hover:bg-[rgba(0,0,0,0.03)] border-b border-border transition-colors"
                >
                  <span
                    className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      allVisible ? "bg-[#FF2D78] border-[#FF2D78]" : "border-gray-300 bg-white"
                    }`}
                  >
                    {allVisible && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  Select all
                </button>
              )
            ) : null}

            {isSearching && (
              <p className="px-3 py-3 text-xs text-text-tertiary flex items-center">
                Searching<SearchingDots />
              </p>
            )}

            {!isSearching && query.trim() && results.length === 0 && (
              <p className="px-3 py-3 text-xs text-text-tertiary">No apps found</p>
            )}

            {!query.trim() && selected.length === 0 && (
              <p className="px-3 py-3 text-xs text-text-tertiary">Type to search apps</p>
            )}

            {/* Show current selections at top when no query */}
            {!query.trim() && selected.length > 0 &&
              selected.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  showCheckbox
                  checked
                  onClick={() => toggle(app)}
                />
              ))
            }

            {/* Search results */}
            {results.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                showCheckbox
                checked={isChecked(app)}
                onClick={() => toggle(app)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
