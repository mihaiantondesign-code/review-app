"use client";

import { useState, useEffect } from "react";
import { AdjustedRatingCard } from "./AdjustedRatingCard";
import { SentimentBreakdown } from "./SentimentBreakdown";
import { ThemesList } from "./ThemesList";
import { analyzeSentiment, analyzeAdjustedMetrics, analyzeThemes } from "@/lib/api";
import { ReviewCategories } from "./ReviewCategories";
import type { Review, SentimentResult, AdjustedMetrics, Theme } from "@/types";

interface InsightsPanelProps {
  reviews: Review[];
  source?: "appstore" | "trustpilot";
}

export function InsightsPanel({ reviews, source = "appstore" }: InsightsPanelProps) {
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [adjustedMetrics, setAdjustedMetrics] = useState<AdjustedMetrics | null>(null);
  const [problems, setProblems] = useState<Theme[]>([]);
  const [wins, setWins] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reviews.length === 0) {
      setLoading(false);
      return;
    }

    const texts = reviews.map((r) => `${r.title} ${r.review}`);

    setLoading(true);
    Promise.all([
      analyzeSentiment(texts),
      analyzeAdjustedMetrics(reviews),
      analyzeThemes(reviews, 1, 2),
      analyzeThemes(reviews, 4, 5),
    ]).then(([sent, adj, probs, w]) => {
      setSentiment(sent);
      setAdjustedMetrics(adj);
      setProblems(probs);
      setWins(w);
      setLoading(false);
    }).catch((err) => {
      console.error("Insights error:", err);
      setLoading(false);
    });
  }, [reviews]);

  if (loading) {
    return (
      <div className="py-8 text-center text-text-secondary text-sm">
        Analyzing reviews...
      </div>
    );
  }

  const total = reviews.length;
  const avgRating = total > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
    : 0;
  const positivePct = total > 0
    ? (reviews.filter((r) => r.rating >= 4).length / total) * 100
    : 0;
  const negativePct = total > 0
    ? (reviews.filter((r) => r.rating <= 2).length / total) * 100
    : 0;

  const sentimentEmoji: Record<string, string> = {
    Positive: "😊",
    Negative: "😟",
    Mixed: "😐",
    Neutral: "😶",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5 flex-wrap">
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Avg Rating</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{avgRating.toFixed(1)} ★</p>
        </div>
        <div className="w-px h-9 bg-border shrink-0" />
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Positive (4-5★)</p>
          <p className="text-xl font-bold text-positive tabular-nums">{positivePct.toFixed(0)}%</p>
        </div>
        <div className="w-px h-9 bg-border shrink-0" />
        <div>
          <p className="text-sm text-text-secondary mb-0.5">Negative (1-2★)</p>
          <p className="text-xl font-bold text-negative tabular-nums">{negativePct.toFixed(0)}%</p>
        </div>
        {sentiment && (
          <>
            <div className="w-px h-9 bg-border shrink-0" />
            <div>
              <p className="text-sm text-text-secondary mb-0.5">Sentiment</p>
              <p className="text-xl font-bold text-text-primary tabular-nums">
                {sentimentEmoji[sentiment.label] || ""} {sentiment.label}
              </p>
            </div>
          </>
        )}
      </div>

      <hr className="border-t border-border" />

      {source === "trustpilot" && (
        <>
          <ReviewCategories reviews={reviews} />
          <hr className="border-t border-border" />
        </>
      )}

      {source === "appstore" && adjustedMetrics && adjustedMetrics.original_count > 0 && (
        <>
          <AdjustedRatingCard metrics={adjustedMetrics} />
          <hr className="border-t border-border" />
        </>
      )}

      {sentiment && (
        <>
          <SentimentBreakdown sentiment={sentiment} />
          <hr className="border-t border-border" />
        </>
      )}

      <ThemesList
        themes={problems}
        title="Top 5 Problems"
        subtitle="The most common complaints and pain points users mention in negative reviews (1-2 stars)."
        emptyMessage="No significant problems found in the reviews!"
      />

      <hr className="border-t border-border" />

      <ThemesList
        themes={wins}
        title="Top 5 Wins"
        subtitle="What users love most, based on positive reviews (4-5 stars)."
        emptyMessage="No strong positive themes found yet."
      />
    </div>
  );
}
