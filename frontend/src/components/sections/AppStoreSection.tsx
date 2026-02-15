"use client";

import { useMemo, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetricCard } from "@/components/shared/MetricCard";
import { StarRating } from "@/components/shared/StarRating";
import { ReviewsTable } from "@/components/shared/ReviewsTable";
import { RatingDistributionChart } from "@/components/shared/RatingDistributionChart";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { VersionInsights } from "@/components/insights/VersionInsights";
import { exportExcel } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";

function FetchingCard() {
  return (
    <div className="flex items-center justify-center min-h-[260px]">
      <div className="rounded-2xl border border-border bg-bg-primary px-10 py-10 flex flex-col items-center gap-5" style={{ boxShadow: "var(--shadow-md)" }}>
        <p className="text-[15px] font-medium text-text-primary tracking-tight">
          We&rsquo;re fetching results
          <span className="inline-flex gap-[3px] ml-1 mb-[1px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block w-[4px] h-[4px] rounded-full bg-text-primary animate-bounce"
                style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.8s" }}
              />
            ))}
          </span>
        </p>
        <div className="relative w-40 h-1 rounded-full overflow-hidden bg-[rgba(0,0,0,0.06)]">
          <div
            className="absolute top-0 left-0 h-full w-1/2 rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--accent), var(--primary))",
              animation: "shimmer 1.4s ease-in-out infinite",
            }}
          />
        </div>
        <style>{`
          @keyframes shimmer {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    </div>
  );
}

export function AppStoreSection({ onDownload }: { onDownload?: () => void }) {
  const { reviews, fetchDone, fetchProgress, isFetching } = useAppStore();
  const hasDownloaded = useRef(false);

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
      // Trigger feedback modal on first download
      if (!hasDownloaded.current) {
        hasDownloaded.current = true;
        onDownload?.();
      }
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  if (isFetching) {
    return <FetchingCard />;
  }

  if (reviews.length === 0) {
    if (fetchDone) {
      return (
        <EmptyState
          icon="🔍"
          title="No reviews found"
          description="Try adjusting your App ID, country, or time range in the sidebar."
          tone="action"
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
    <div>
      {/* Inline progress bar shown while still fetching more pages */}
      {isFetching && fetchProgress && (
        <div className="mb-6 px-4 py-3 bg-bg-secondary rounded-lg flex items-center gap-3">
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-text-primary rounded-full transition-all duration-300"
              style={{ width: `${(fetchProgress.page / fetchProgress.total_pages) * 100}%` }}
            />
          </div>
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {fetchProgress.message}
          </span>
        </div>
      )}

      {/* Chapter 1: Score overview — the focal point */}
      {stats && (
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-4xl font-bold text-text-primary tracking-tight">
              {stats.avg.toFixed(1)}
            </span>
            <StarRating rating={stats.avg} size="lg" />
            <span className="text-sm text-text-tertiary">/ 5</span>
          </div>
          <p className="text-[13px] text-text-secondary mb-5">
            Based on <strong>{stats.total}</strong> reviews
          </p>

          <div className="grid grid-cols-5 gap-3">
            {stats.counts.map((c) => (
              <MetricCard
                key={c.rating}
                label={"★".repeat(c.rating)}
                value={`${c.count}`}
                help={`${c.pct.toFixed(1)}% of all reviews`}
              />
            ))}
          </div>

          <div className="mt-6">
            <RatingDistributionChart reviews={reviews} />
          </div>
        </section>
      )}

      {/* Chapter 2: Reviews data */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[22px] font-semibold text-text-primary tracking-tight">
            All Reviews
          </h3>
          <button
            onClick={handleDownload}
            className="py-2 px-5 text-xs font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97]"
          >
            Download Excel
          </button>
        </div>
        <ReviewsTable reviews={reviews} />
      </section>

      {/* Chapter 3: Insights — opens up into breathing room */}
      <section className="bg-bg-secondary rounded-lg p-6 mb-10">
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-6">
          Insights
        </h3>
        <InsightsPanel reviews={reviews} />
      </section>

      {/* Chapter 4: Version data */}
      <section>
        <VersionInsights reviews={reviews} />
      </section>
    </div>
  );
}
