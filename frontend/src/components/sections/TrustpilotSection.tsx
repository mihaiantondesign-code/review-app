"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useFetchTrustpilot } from "@/hooks/useFetchTrustpilot";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetricCard } from "@/components/shared/MetricCard";
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
    <div className="space-y-6">
      <div>
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
          Trustpilot Reviews
        </h3>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Fetch and analyze reviews from Trustpilot. Independent from App Store data.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1">
            Trustpilot Domain
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. bancobpm.it"
            className="w-full px-3 py-2 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1">
            Months back: {months}
          </label>
          <input
            type="range"
            min={1}
            max={24}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full accent-text-primary mt-2"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1">
            Max pages
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
          />
        </div>
      </div>

      <button
        onClick={handleFetch}
        disabled={!domain.trim() || isTpFetching}
        className="py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all hover:bg-black hover:shadow-md disabled:bg-[rgba(0,0,0,0.06)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed"
      >
        {isTpFetching ? "Fetching..." : "Fetch Trustpilot Reviews"}
      </button>

      <hr className="border-t border-border" />

      {isTpFetching && tpFetchProgress && (
        <ProgressOverlay progress={tpFetchProgress} />
      )}

      {!isTpFetching && trustpilotReviews.length === 0 && (
        tpFetchDone ? (
          <EmptyState
            icon="🔍"
            title="No Trustpilot reviews found"
            description="Check the domain name and try again with a wider time range."
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
          {trustpilotInfo && (
            <div>
              <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-3">
                {trustpilotInfo.name} on Trustpilot
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <MetricCard
                  label="TrustScore"
                  value={`${trustpilotInfo.trustScore.toFixed(1)} / 5`}
                />
                <MetricCard
                  label="Stars"
                  value={"★".repeat(Math.round(trustpilotInfo.stars))}
                />
                <MetricCard
                  label="Total Reviews (all time)"
                  value={String(trustpilotInfo.totalReviews)}
                />
              </div>
            </div>
          )}

          <p className="text-[13px] text-text-secondary">
            Showing <strong>{trustpilotReviews.length}</strong> reviews within the selected time period
          </p>

          <hr className="border-t border-border" />

          <InsightsPanel reviews={trustpilotReviews} />

          <hr className="border-t border-border" />

          <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-4">
            All Trustpilot Reviews
          </h3>
          <ReviewsTable reviews={trustpilotReviews} />

          <hr className="border-t border-border" />

          <button
            onClick={handleDownload}
            className="py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all hover:bg-black hover:shadow-md"
          >
            Download Trustpilot Reviews (Excel)
          </button>
        </>
      )}
    </div>
  );
}
