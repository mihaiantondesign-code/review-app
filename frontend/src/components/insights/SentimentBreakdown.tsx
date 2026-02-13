"use client";

import { MetricCard } from "@/components/shared/MetricCard";
import { SentimentChart } from "@/components/shared/SentimentChart";
import type { SentimentResult } from "@/types";

interface SentimentBreakdownProps {
  sentiment: SentimentResult;
}

export function SentimentBreakdown({ sentiment }: SentimentBreakdownProps) {
  return (
    <div>
      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
        Sentiment Breakdown
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        Analysis of positive and negative language used across all reviews.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <MetricCard label="Positive Words Found" value={String(sentiment.positive)} />
        <MetricCard label="Negative Words Found" value={String(sentiment.negative)} />
        <MetricCard
          label="Sentiment Score"
          value={`${sentiment.score >= 0 ? "+" : ""}${sentiment.score.toFixed(2)}`}
          help="Range: -1.0 (very negative) to +1.0 (very positive)"
        />
      </div>

      <SentimentChart positive={sentiment.positive} negative={sentiment.negative} />
    </div>
  );
}
