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
  const deltaSign = metrics.rating_delta >= 0 ? "+" : "";
  const deltaContext =
    metrics.rating_delta > 0
      ? "App experience rates higher"
      : metrics.rating_delta < 0
        ? "App experience rates lower"
        : "No change";

  return (
    <div>
      <h3 className="text-[16px] font-semibold text-[#0051B3] tracking-tight mb-1">
        Adjusted Rating
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed mb-4">
        Excludes reviews about pricing, support, policies, and physical locations
        to isolate app-specific feedback.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <MetricCard
          label="Original Rating"
          value={`${metrics.original_avg.toFixed(2)} ★`}
          help={`Based on all ${metrics.original_count} reviews`}
        />
        <MetricCard
          label="Adjusted Rating"
          value={`${metrics.adjusted_avg.toFixed(2)} ★`}
          delta={`${deltaSign}${metrics.rating_delta.toFixed(2)} · ${deltaContext}`}
          help={`Based on ${metrics.adjusted_count} app-related reviews`}
          prominent
        />
        <MetricCard
          label="Excluded Reviews"
          value={`${metrics.excluded_count}`}
          help={`${metrics.excluded_pct.toFixed(0)}% of total reviews excluded`}
          delta={`${metrics.excluded_pct.toFixed(0)}% of total`}
        />
      </div>

      {Object.keys(metrics.category_breakdown).length > 0 && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-2">
            Excluded by category
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
