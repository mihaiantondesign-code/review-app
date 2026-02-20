"use client";

import React from "react";
import type { AdjustedMetrics } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  pricing: "Pricing & Billing",
  support: "Customer Support",
  policy: "Policy & Terms",
  external: "Branches & Staff",
};

interface AdjustedRatingCardProps {
  metrics: AdjustedMetrics;
  /** The global App Store rating shown on the store listing page */
  storeRating?: number;
  /** Total number of ratings on the App Store listing */
  storeRatingsCount?: number;
}

export function AdjustedRatingCard({ metrics, storeRating, storeRatingsCount }: AdjustedRatingCardProps) {
  const deltaSign = metrics.rating_delta >= 0 ? "+" : "";
  const deltaContext =
    metrics.rating_delta > 0
      ? "App experience rates higher"
      : metrics.rating_delta < 0
        ? "App experience rates lower"
        : "No change";

  const categoryEntries = Object.entries(metrics.category_breakdown).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div>
      <h3 className="text-[16px] font-semibold text-[#0051B3] tracking-tight mb-1">
        Ratings
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed mb-4">
        Three views of your rating: the global App Store score, the average from fetched reviews, and an adjusted score that excludes off-topic feedback.
      </p>

      {/* 3 rating stats — divider separated */}
      <div className="flex items-start gap-5 flex-wrap mb-4">
        {storeRating !== undefined && (
          <>
            <div>
              <p className="text-sm text-text-secondary mb-0.5">App Store Rating</p>
              <p className="text-xl font-bold text-text-primary tabular-nums">{storeRating.toFixed(1)} ★</p>
              {storeRatingsCount !== undefined && (
                <p className="text-sm text-text-tertiary">{storeRatingsCount.toLocaleString()} ratings</p>
              )}
            </div>
            <div className="w-px h-9 bg-border shrink-0 mt-1" />
          </>
        )}
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Qualitative Rating</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{metrics.original_avg.toFixed(2)} ★</p>
          <p className="text-sm text-text-tertiary">{metrics.original_count} reviews fetched</p>
        </div>
        <div className="w-px h-9 bg-border shrink-0 mt-1" />
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Adjusted Rating</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{metrics.adjusted_avg.toFixed(2)} ★</p>
          <p className={`text-sm font-semibold ${metrics.rating_delta >= 0 ? "text-positive" : "text-negative"}`}>
            {deltaSign}{metrics.rating_delta.toFixed(2)} · {deltaContext}
          </p>
        </div>
        <div className="w-px h-9 bg-border shrink-0 mt-1" />
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Excluded</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{metrics.excluded_count}</p>
          <p className="text-sm text-text-tertiary">{metrics.excluded_pct.toFixed(0)}% of total</p>
        </div>
      </div>

      {/* Category breakdown — divider separated */}
      {categoryEntries.length > 0 && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-2">
            Excluded by category
          </p>
          <div className="flex items-start gap-5 flex-wrap">
            {categoryEntries.map(([cat, count], idx) => (
              <React.Fragment key={cat}>
                <div>
                  <p className="text-sm text-text-secondary mb-0.5">{CATEGORY_LABELS[cat] || cat}</p>
                  <p className="text-xl font-bold text-text-primary tabular-nums">{count}</p>
                </div>
                {idx < categoryEntries.length - 1 && (
                  <div className="w-px h-9 bg-border shrink-0 mt-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
