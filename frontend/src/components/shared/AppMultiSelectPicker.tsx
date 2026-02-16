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
  placeholder = "Search app name…",
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
        setQuery("");
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
      const visibleIds = new Set(results.map((r) => r.id));
      onChange(selected.filter((s) => !visibleIds.has(s.id)));
    } else {
      const toAdd = results.filter((r) => !isChecked(r));
      const next = [...selected, ...toAdd];
      onChange(max ? next.slice(0, max) : next);
    }
  };

  // Display label shown as overlay when picker is closed
  const triggerLabel =
    selected.length === 0
      ? ""
      : selected.length === 1
      ? selected[0].name
      : `${selected.length} apps selected`;

  return (
    <div ref={containerRef} className="relative">
      {/* Single merged input — serves as both trigger and search field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          // When open: show the live query (empty = show placeholder with current name)
          // When closed: always empty (overlay shows selected name instead)
          value={open ? query : ""}
          placeholder={open && triggerLabel ? triggerLabel : placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            // Numeric app ID direct-select
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
          className={`w-full px-3 py-2.5 min-h-[44px] text-sm border rounded-xl bg-bg-primary outline-none transition-all ${
            open
              ? "border-accent ring-2 ring-accent/15"
              : "border-border-strong hover:border-accent/50"
          }`}
        />

        {/* Selected app name overlay — visible only when closed and something is selected */}
        {!open && triggerLabel && (
          <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
            <span className="text-sm text-text-primary font-medium truncate pr-8">{triggerLabel}</span>
          </div>
        )}

        {/* Searching overlay */}
        {isSearching && open && (
          <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
            <span className="text-sm text-text-tertiary flex items-center">
              Searching<SearchingDots />
            </span>
          </div>
        )}
      </div>

      {/* Dropdown results — no internal search input, just the list */}
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-bg-primary border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto">
            {/* Select all row — only in multi-select mode with results */}
            {(!max || max > 1) && results.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-[rgba(0,0,0,0.03)] border-b border-border transition-colors"
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
            )}

            {isSearching && (
              <p className="px-3 py-3 text-sm text-text-tertiary flex items-center">
                Searching<SearchingDots />
              </p>
            )}

            {!isSearching && query.trim() && results.length === 0 && (
              <p className="px-3 py-3 text-sm text-text-tertiary">No apps found</p>
            )}

            {!query.trim() && selected.length === 0 && (
              <p className="px-3 py-3 text-sm text-text-tertiary">Type to search apps</p>
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
