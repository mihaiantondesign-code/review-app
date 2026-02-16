"use client";

import type { InsightDimension, InsightQuery, MatchMode } from "@/types";

const DIM_LABELS: Record<InsightDimension, string> = {
  topics: "topic",
  custom_topics: "keyword",
  tags: "tag",
};

interface InsightQueryBarProps {
  query: InsightQuery;
  onClearItem: (dimension: InsightDimension, value: string) => void;
  onClearAll: () => void;
  onSetMatchMode: (mode: MatchMode) => void;
  totalIncluded: number;
}

export function InsightQueryBar({
  query,
  onClearItem,
  onClearAll,
  onSetMatchMode,
  totalIncluded,
}: InsightQueryBarProps) {
  const dims: InsightDimension[] = ["topics", "custom_topics", "tags"];

  const includeChips = dims.flatMap((dim) =>
    query.include[dim].map((val) => ({ dim, val, type: "include" as const }))
  );
  const excludeChips = dims.flatMap((dim) =>
    query.exclude[dim].map((val) => ({ dim, val, type: "exclude" as const }))
  );

  const hasAny = includeChips.length > 0 || excludeChips.length > 0;
  const showMatchMode = totalIncluded >= 2;

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        hasAny ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="sticky top-0 z-20 bg-bg-primary border-b border-border px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap"
           style={{ boxShadow: "0 1px 0 var(--color-border)" }}>

        {/* Chips row */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {includeChips.map(({ dim, val }) => (
            <span
              key={`inc-${dim}-${val}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(34,197,94,0.12)] text-[#16a34a] border border-[rgba(34,197,94,0.25)]"
            >
              <span className="text-[10px] font-semibold text-[#16a34a] opacity-60 uppercase tracking-wide">{DIM_LABELS[dim]}:</span>
              {val}
              <button
                type="button"
                onClick={() => onClearItem(dim, val)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
                aria-label={`Remove ${val}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}

          {excludeChips.map(({ dim, val }) => (
            <span
              key={`exc-${dim}-${val}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(239,68,68,0.10)] text-[#dc2626] border border-[rgba(239,68,68,0.20)]"
            >
              <span className="text-[10px] font-semibold text-[#dc2626] opacity-60 uppercase tracking-wide">{DIM_LABELS[dim]}:</span>
              <span className="line-through opacity-70">{val}</span>
              <button
                type="button"
                onClick={() => onClearItem(dim, val)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
                aria-label={`Remove ${val}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>

        {/* Match mode toggle — only when 2+ includes */}
        {showMatchMode && (
          <div className="flex items-center gap-1 bg-bg-secondary rounded-full p-0.5 shrink-0">
            {(["ANY", "ALL"] as MatchMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onSetMatchMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 ${
                  query.match_mode === mode
                    ? "bg-bg-primary text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        )}

        {/* Clear all */}
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors shrink-0"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
