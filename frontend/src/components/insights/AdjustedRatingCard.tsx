"use client";

import { MetricCard } from "@/components/shared/MetricCard";
import type { AdjustedMetrics } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  pricing: "Pricing & Billing",
  support: "Customer Support",
  policy: "Policy & Terms",
  external: "Branches & Staff",
};

interface AdjustedRatingCardProps {
  metrics: AdjustedMetrics;
}

export function AdjustedRatingCard({ metrics }: AdjustedRatingCardProps) {
  return (
    <div>
      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
        Adjusted Rating — App Experience Only
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        Reviews about pricing, customer support, company policies, or physical
        locations are excluded to isolate feedback specifically about the app
        experience.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <MetricCard
          label="Original Rating"
          value={`${metrics.original_avg.toFixed(2)} ★`}
          help={`Based on all ${metrics.original_count} reviews`}
        />
        <MetricCard
          label="Adjusted Rating"
          value={`${metrics.adjusted_avg.toFixed(2)} ★`}
          delta={`${metrics.rating_delta >= 0 ? "+" : ""}${metrics.rating_delta.toFixed(2)}`}
          help={`Based on ${metrics.adjusted_count} app-related reviews`}
        />
        <MetricCard
          label="Excluded Reviews"
          value={`${metrics.excluded_count} (${metrics.excluded_pct.toFixed(0)}%)`}
          help="Reviews classified as not about the app experience itself"
        />
      </div>

      {Object.keys(metrics.category_breakdown).length > 0 && (
        <div>
          <p className="text-sm font-semibold text-text-primary mb-2">
            Excluded reviews by category:
          </p>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(metrics.category_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <MetricCard
                  key={cat}
                  label={CATEGORY_LABELS[cat] || cat}
                  value={String(count)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
