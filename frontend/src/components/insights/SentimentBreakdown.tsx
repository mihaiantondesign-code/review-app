"use client";

import { SentimentChart } from "@/components/shared/SentimentChart";
import type { SentimentResult } from "@/types";

interface SentimentBreakdownProps {
  sentiment: SentimentResult;
}

export function SentimentBreakdown({ sentiment }: SentimentBreakdownProps) {
  return (
    <div>
      <h3 className="text-[16px] font-semibold text-[#0051B3] tracking-tight mb-1">
        Sentiment Breakdown
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed mb-4">
        Analysis of positive and negative language used across all reviews.
      </p>

      {/* Inline stats separated by dividers — no card boxes */}
      <div className="flex items-center gap-5 mb-5 flex-wrap">
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Positive words</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{sentiment.positive}</p>
        </div>
        <div className="w-px h-9 bg-border shrink-0" />
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Negative words</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{sentiment.negative}</p>
        </div>
        <div className="w-px h-9 bg-border shrink-0" />
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Sentiment score</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">
            {sentiment.score >= 0 ? "+" : ""}{sentiment.score.toFixed(2)}
          </p>
        </div>
      </div>

      <SentimentChart positive={sentiment.positive} negative={sentiment.negative} />
    </div>
  );
}
