"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetricCard } from "@/components/shared/MetricCard";
import { ProgressOverlay } from "@/components/shared/ProgressOverlay";
import { ReviewsTable } from "@/components/shared/ReviewsTable";
import { RatingDistributionChart } from "@/components/shared/RatingDistributionChart";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { VersionInsights } from "@/components/insights/VersionInsights";
import { exportExcel } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";

export function AppStoreSection() {
  const { reviews, fetchDone, fetchProgress, isFetching } = useAppStore();

  const stats = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.length;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;
    const counts = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: reviews.filter((rev) => rev.rating === r).length,
      pct: (reviews.filter((rev) => rev.rating === r).length / total) * 100,
    }));
    return { total, avg, counts };
  }, [reviews]);

  const handleDownload = async () => {
    try {
      const blob = await exportExcel(reviews);
      downloadBlob(blob, "app_reviews.xlsx");
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  if (isFetching && fetchProgress) {
    return <ProgressOverlay progress={fetchProgress} />;
  }

  if (reviews.length === 0) {
    if (fetchDone) {
      return (
        <EmptyState
          icon="🔍"
          title="No reviews found"
          description="Try adjusting your App ID, country, or time range in the sidebar."
        />
      );
    }
    return (
      <EmptyState
        icon="📱"
        title="No results yet"
        description="Search for an app in the sidebar and click Fetch Reviews to get started."
      />
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <>
          <div>
            <h3 className="text-[22px] font-semibold text-text-primary tracking-tight">
              Overall Score: {"★".repeat(Math.round(stats.avg))}{" "}
              <span className="font-bold">{stats.avg.toFixed(1)}</span> / 5
            </h3>
            <p className="text-[13px] text-text-secondary">
              Based on <strong>{stats.total}</strong> reviews
            </p>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {stats.counts.map((c) => (
              <MetricCard
                key={c.rating}
                label={"★".repeat(c.rating)}
                value={`${c.count} (${c.pct.toFixed(0)}%)`}
              />
            ))}
          </div>

          <hr className="border-t border-border" />

          <div>
            <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-2">
              Rating Distribution
            </h3>
            <RatingDistributionChart reviews={reviews} />
          </div>

          <hr className="border-t border-border" />
        </>
      )}

      <div>
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-4">
          All Reviews
        </h3>
        <ReviewsTable reviews={reviews} />
      </div>

      <hr className="border-t border-border" />

      <button
        onClick={handleDownload}
        className="py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all hover:bg-black hover:shadow-md"
      >
        Download Reviews (Excel)
      </button>

      <hr className="border-t border-border" />

      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight">
        Insights
      </h3>
      <InsightsPanel reviews={reviews} />

      <hr className="border-t border-border" />

      <VersionInsights reviews={reviews} />
    </div>
  );
}
