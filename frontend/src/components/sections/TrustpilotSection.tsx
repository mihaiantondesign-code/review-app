"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useFetchTrustpilot } from "@/hooks/useFetchTrustpilot";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetricCard } from "@/components/shared/MetricCard";
import { StarRating } from "@/components/shared/StarRating";
import { ProgressOverlay } from "@/components/shared/ProgressOverlay";
import { ReviewsTable } from "@/components/shared/ReviewsTable";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { exportExcel } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";

export function TrustpilotSection() {
  const {
    trustpilotReviews,
    trustpilotInfo,
    tpFetchDone,
    tpFetchProgress,
    isTpFetching,
  } = useAppStore();

  const { fetch: fetchTP } = useFetchTrustpilot();

  const [domain, setDomain] = useState("");
  const [months, setMonths] = useState(12);
  const [maxPages, setMaxPages] = useState(10);

  const handleFetch = () => {
    if (!domain.trim()) return;
    fetchTP(domain.trim(), maxPages, months * 30);
  };

  const handleDownload = async () => {
    try {
      const blob = await exportExcel(trustpilotReviews);
      downloadBlob(blob, "trustpilot_reviews.xlsx");
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <div>
      {/* Input controls */}
      <section className="mb-8">
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
          Trustpilot Reviews
        </h3>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
          Fetch and analyze reviews from Trustpilot. Independent from App Store data.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Trustpilot Domain
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. company.com"
              className="w-full px-3 py-2.5 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
          </div>
          <div>
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
              className="w-full accent-text-primary mt-1"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Max pages
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
        </div>

        <button
          onClick={handleFetch}
          disabled={!domain.trim() || isTpFetching}
          className="py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97] disabled:bg-[rgba(0,0,0,0.06)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isTpFetching ? "Fetching..." : "Fetch Trustpilot Reviews"}
        </button>
      </section>

      {isTpFetching && tpFetchProgress && (
        <ProgressOverlay progress={tpFetchProgress} />
      )}

      {!isTpFetching && trustpilotReviews.length === 0 && (
        tpFetchDone ? (
          <EmptyState
            icon="🔍"
            title="No Trustpilot reviews found"
            description="Check the domain name and try again with a wider time range."
            tone="action"
          />
        ) : (
          <EmptyState
            icon="💬"
            title="No Trustpilot data yet"
            description="Enter a domain above and click Fetch Trustpilot Reviews to get started."
          />
        )
      )}

      {trustpilotReviews.length > 0 && (
        <>
          {/* Business info — focal point */}
          {trustpilotInfo && (
            <section className="mb-8">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-2xl font-bold text-text-primary tracking-tight">
                  {trustpilotInfo.name}
                </span>
                <span className="text-sm text-text-tertiary">on Trustpilot</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <MetricCard
                  label="TrustScore"
                  value={`${trustpilotInfo.trustScore.toFixed(1)} / 5`}
                  prominent
                />
                <MetricCard
                  label="Stars"
                  value={"★".repeat(Math.round(trustpilotInfo.stars))}
                />
                <MetricCard
                  label="Total Reviews (all time)"
                  value={trustpilotInfo.totalReviews.toLocaleString()}
                />
              </div>
              <p className="text-[13px] text-text-secondary mt-4">
                Showing <strong>{trustpilotReviews.length}</strong> reviews within the selected time period
              </p>
            </section>
          )}

          {/* Insights panel */}
          <section className="bg-bg-secondary rounded-lg p-6 mb-8">
            <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-6">
              Insights
            </h3>
            <InsightsPanel reviews={trustpilotReviews} />
          </section>

          {/* Reviews table + download */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[22px] font-semibold text-text-primary tracking-tight">
                All Trustpilot Reviews
              </h3>
              <button
                onClick={handleDownload}
                className="py-2 px-5 text-xs font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97]"
              >
                Download Excel
              </button>
            </div>
            <ReviewsTable reviews={trustpilotReviews} />
          </section>
        </>
      )}
    </div>
  );
}
