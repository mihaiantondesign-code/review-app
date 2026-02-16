"use client";

import { useState } from "react";
import { InsightChip } from "@/components/shared/InsightChip";
import type { InsightDimension, InsightQuery } from "@/types";

interface InsightSectionProps {
  title: string;
  items: { label: string; count: number }[];
  query: InsightQuery;
  dimension: InsightDimension;
  onToggleInclude: (dimension: InsightDimension, label: string) => void;
  onToggleExclude: (dimension: InsightDimension, label: string) => void;
  onClearItem: (dimension: InsightDimension, label: string) => void;
  isLoading: boolean;
}

const SHOW_DEFAULT = 10;

export function InsightSection({
  title,
  items,
  query,
  dimension,
  onToggleInclude,
  onToggleExclude,
  onClearItem,
  isLoading,
}: InsightSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleItems = showAll ? items : items.slice(0, SHOW_DEFAULT);
  const hasMore = items.length > SHOW_DEFAULT;

  const getChipState = (label: string) => {
    if (query.include[dimension].includes(label)) return "included" as const;
    if (query.exclude[dimension].includes(label)) return "excluded" as const;
    return "neutral" as const;
  };

  return (
    <div className="bg-bg-primary rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[rgba(0,0,0,0.02)] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-semibold text-text-primary">{title}</span>
          {!isLoading && items.length > 0 && (
            <span className="text-xs font-semibold text-text-tertiary bg-bg-secondary rounded-full px-2 py-0.5 tabular-nums">
              {items.length}
            </span>
          )}
        </div>
        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-text-tertiary transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 pb-5 border-t border-border">
          {isLoading ? (
            // Skeleton
            <div className="flex flex-wrap gap-2 pt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 rounded-full bg-[rgba(0,0,0,0.06)] animate-pulse"
                  style={{ width: `${60 + (i % 4) * 20}px` }}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="pt-4 text-sm text-text-tertiary">No items found.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 pt-4">
                {visibleItems.map((item) => (
                  <InsightChip
                    key={item.label}
                    label={item.label}
                    count={item.count}
                    state={getChipState(item.label)}
                    onInclude={() => onToggleInclude(dimension, item.label)}
                    onExclude={() => onToggleExclude(dimension, item.label)}
                    onClear={() => onClearItem(dimension, item.label)}
                  />
                ))}
              </div>

              {hasMore && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-3 text-sm font-medium text-accent hover:underline"
                >
                  {showAll ? "Show less" : `Show all ${items.length} →`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
