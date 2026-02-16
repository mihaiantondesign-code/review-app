"use client";

import { useState, useEffect, useMemo, useCallback, useRef, type ReactElement } from "react";
import { useAppStore } from "@/store/useAppStore";
import { classifyBatch } from "@/lib/classifier";
import { ProblemChip, CATEGORY_CONFIG } from "@/components/shared/ProblemChip";
import { StarRating } from "@/components/shared/StarRating";
import { formatDate } from "@/lib/utils";
import type { ProblemCategory, ClassifiedReview, Review } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: ProblemCategory[] = [
  "TECHNICAL",
  "DESIGN",
  "CUSTOMER_EXPERIENCE",
  "PRICING",
  "PERFORMANCE",
];

const CATEGORY_ICONS: Record<ProblemCategory, ReactElement> = {
  TECHNICAL: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  DESIGN: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  CUSTOMER_EXPERIENCE: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  PRICING: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  PERFORMANCE: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

// ─── Review card ─────────────────────────────────────────────────────────────

function BacklogReviewCard({
  review,
  onCategoryClick,
}: {
  review: ClassifiedReview;
  onCategoryClick: (cat: ProblemCategory) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.review.length > 220;
  const text = !isLong || expanded ? review.review : review.review.slice(0, 220) + "…";
  const sentimentLabel = review.rating >= 4 ? "Positive" : review.rating <= 2 ? "Negative" : "Neutral";
  const sentimentColor = review.rating >= 4 ? "text-[#34C759]" : review.rating <= 2 ? "text-[#FF3B30]" : "text-text-secondary";

  return (
    <div className="bg-bg-primary rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} size="sm" />
          </div>
          <h4 className="text-[16px] font-semibold text-[#0051B3] mb-1.5 leading-snug">{review.title || "(no title)"}</h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {text}
            {isLong && (
              <button onClick={() => setExpanded((v) => !v)} className="ml-1 text-accent text-sm font-medium hover:underline">
                {expanded ? "less" : "more"}
              </button>
            )}
          </p>
        </div>
        <div className="flex sm:flex-col gap-x-4 gap-y-2 flex-wrap sm:shrink-0 sm:w-[160px] sm:border-l sm:border-border sm:pl-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-0.5">Published</p>
            <p className="text-sm font-medium text-text-primary">{formatDate(review.date)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-0.5">Author</p>
            <p className="text-sm font-medium text-text-primary truncate">{review.author || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-0.5">Sentiment</p>
            <p className={`text-sm font-medium ${sentimentColor}`}>{sentimentLabel}</p>
          </div>
          {review.classification_status === "classified" && review.problem_categories.length > 0 && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-1">Problem</p>
              <div className="flex flex-wrap gap-1">
                {review.problem_categories.map((cat) => (
                  <ProblemChip key={cat} category={cat} size="xs" onClick={() => onCategoryClick(cat)} />
                ))}
              </div>
            </div>
          )}
          {review.classification_status === "pending" && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-1">Problem</p>
              <span className="text-xs text-text-tertiary italic">Classifying…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sentiment bar ────────────────────────────────────────────────────────────

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full">
      <div className="bg-[#34C759] h-full transition-all" style={{ width: `${positive}%` }} />
      <div className="bg-[rgba(0,0,0,0.12)] h-full transition-all" style={{ width: `${neutral}%` }} />
      <div className="bg-[#FF3B30] h-full transition-all" style={{ width: `${negative}%` }} />
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  count,
  total,
  sentiment,
  topTopics,
  trend,
  isActive,
  onViewReviews,
}: {
  category: ProblemCategory;
  count: number;
  total: number;
  sentiment: { positive: number; neutral: number; negative: number };
  topTopics: string[];
  trend: number | null;
  isActive: boolean;
  onViewReviews: () => void;
}) {
  const cfg = CATEGORY_CONFIG[category];
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

  return (
    <div
      className={`bg-bg-primary rounded-xl border p-5 flex flex-col gap-4 transition-all duration-150 ${
        isActive ? "border-[rgba(0,0,0,0.25)] ring-2 ring-[rgba(0,0,0,0.06)]" : "border-border hover:border-[rgba(0,0,0,0.15)]"
      }`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
          >
            {CATEGORY_ICONS[category]}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-text-primary leading-tight">{cfg.label === "CX" ? "Customer Experience" : cfg.label}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{pct}% of reviews</p>
          </div>
        </div>
        {trend !== null && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? "text-[#FF3B30]" : trend < 0 ? "text-[#34C759]" : "text-text-tertiary"}`}>
            {trend > 0 ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : trend < 0 ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M6 2.5V9.5M6 9.5L2.5 6M6 9.5L9.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Count */}
      <div>
        <p className="text-[32px] font-bold text-text-primary leading-none tabular-nums">{count.toLocaleString()}</p>
        <p className="text-xs text-text-tertiary mt-1">reviews with this problem</p>
      </div>

      {/* Sentiment bar */}
      <div className="flex flex-col gap-1.5">
        <SentimentBar positive={sentiment.positive} neutral={sentiment.neutral} negative={sentiment.negative} />
        <div className="flex justify-between text-[10px] text-text-tertiary">
          <span>{sentiment.positive}% positive</span>
          <span>{sentiment.negative}% negative</span>
        </div>
      </div>

      {/* Top topics */}
      {topTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topTopics.map((t) => (
            <span key={t} className="px-2 py-0.5 text-[11px] font-medium bg-bg-secondary text-text-secondary rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={onViewReviews}
        className="mt-auto text-sm font-semibold text-accent hover:underline text-left"
      >
        View reviews →
      </button>
    </div>
  );
}

// ─── Summary bar chips ────────────────────────────────────────────────────────

function SummaryBar({
  categoryCounts,
  activeCategories,
  onToggle,
}: {
  categoryCounts: Record<ProblemCategory, number>;
  activeCategories: Set<ProblemCategory>;
  onToggle: (cat: ProblemCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_CATEGORIES.map((cat) => {
        const cfg = CATEGORY_CONFIG[cat];
        const count = categoryCounts[cat] ?? 0;
        const isActive = activeCategories.has(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onToggle(cat)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 active:scale-[0.97] ${
              isActive ? "shadow-sm" : "hover:opacity-80"
            }`}
            style={
              isActive
                ? { color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }
                : { color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-secondary)", borderColor: "transparent" }
            }
          >
            {cfg.label === "CX" ? "CX" : cfg.shortLabel}
            <span className="tabular-nums text-[11px] font-bold opacity-70">{count.toLocaleString()}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main BacklogSection ──────────────────────────────────────────────────────

export function BacklogSection() {
  const { reviews } = useAppStore();
  const [activeCategories, setActiveCategories] = useState<Set<ProblemCategory>>(new Set());
  const reviewListRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // ─── Classify synchronously (local rule-based, instant) ───────────────────
  const classifiedReviews = useMemo<ClassifiedReview[]>(() => {
    if (reviews.length === 0) return [];
    const results = classifyBatch(reviews);
    return reviews.map((r, i) => ({
      ...r,
      problem_categories: results[i],
      classification_status: "classified" as const,
    }));
  }, [reviews]);

  // ─── Compute category stats ────────────────────────────────────────────────
  const classified = classifiedReviews;

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<ProblemCategory, number>;
    for (const cat of ALL_CATEGORIES) counts[cat] = 0;
    for (const rev of classified) {
      for (const cat of rev.problem_categories) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return counts;
  }, [classified]);

  const categoryStats = useMemo(() => {
    return ALL_CATEGORIES.map((cat) => {
      const catRevs = classified.filter((r) => r.problem_categories.includes(cat));
      const count = catRevs.length;
      const posCount = catRevs.filter((r) => r.rating >= 4).length;
      const negCount = catRevs.filter((r) => r.rating <= 2).length;
      const neutCount = count - posCount - negCount;
      const sentiment = count > 0
        ? {
            positive: Math.round((posCount / count) * 100),
            neutral: Math.round((neutCount / count) * 100),
            negative: Math.round((negCount / count) * 100),
          }
        : { positive: 0, neutral: 0, negative: 100 };

      // Top 3 topics: most common words in this category's reviews
      const wordFreq = new Map<string, number>();
      for (const rev of catRevs) {
        const words = rev.review.toLowerCase().match(/[a-z]{4,}/g) ?? [];
        const STOPWORDS = new Set(["this", "that", "with", "have", "from", "they", "will", "been", "were", "your", "more", "when", "then", "than", "what", "just", "like", "also", "about", "very", "some", "into", "does", "dont", "cant", "which"]);
        for (const w of words) {
          if (!STOPWORDS.has(w)) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
        }
      }
      const topTopics = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([w]) => w);

      return { category: cat, count, sentiment, topTopics, trend: null as number | null };
    });
  }, [classified]);

  // ─── Filtered reviews for listing ─────────────────────────────────────────
  const filteredReviews = useMemo(() => {
    if (activeCategories.size === 0) return classifiedReviews;
    return classifiedReviews.filter(
      (r) =>
        r.classification_status === "classified" &&
        r.problem_categories.some((cat) => activeCategories.has(cat))
    );
  }, [classifiedReviews, activeCategories]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [activeCategories]);

  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
  const paginatedReviews = filteredReviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleCategory = useCallback((cat: ProblemCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleViewReviews = useCallback(
    (cat: ProblemCategory) => {
      setActiveCategories(new Set([cat]));
      setTimeout(() => {
        reviewListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    []
  );

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <span className="text-5xl">🗂</span>
        <div>
          <p className="text-[17px] font-semibold text-text-primary mb-1">No reviews loaded yet</p>
          <p className="text-sm text-text-tertiary">Fetch App Store reviews first to see the backlog.</p>
        </div>
      </div>
    );
  }

  const problemReviewCount = classified.filter((r) => r.problem_categories.length > 0).length;

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-text-primary tracking-tight mb-1">Backlog</h1>
        <p className="text-sm text-text-secondary">Problem categories extracted from reviews to inform your next sprint</p>
      </div>

      {/* Summary bar */}
      <div className="mb-6">
        <SummaryBar
          categoryCounts={categoryCounts}
          activeCategories={activeCategories}
          onToggle={toggleCategory}
        />
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {categoryStats
          .sort((a, b) => b.count - a.count)
          .map((stat) => (
            <CategoryCard
              key={stat.category}
              category={stat.category}
              count={stat.count}
              total={reviews.length}
              sentiment={stat.sentiment}
              topTopics={stat.topTopics}
              trend={stat.trend}
              isActive={activeCategories.has(stat.category)}
              onViewReviews={() => handleViewReviews(stat.category)}
            />
          ))}
      </div>

      {/* Active filter bar */}
      {activeCategories.size > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-sm text-text-secondary">Filtering by:</span>
          {Array.from(activeCategories).map((cat) => (
            <ProblemChip key={cat} category={cat} size="sm" />
          ))}
          <button
            type="button"
            onClick={() => setActiveCategories(new Set())}
            className="text-xs font-medium text-text-tertiary hover:text-text-primary ml-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* Review listing */}
      <div ref={reviewListRef}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-text-secondary">
            {activeCategories.size > 0 ? (
              <>
                Showing{" "}
                <span className="font-bold text-text-primary">{filteredReviews.length.toLocaleString()}</span>{" "}
                reviews with{" "}
                {Array.from(activeCategories).map((c) => CATEGORY_CONFIG[c].label).join(", ")}{" "}
                {filteredReviews.length === 1 ? "problem" : "problems"}
              </>
            ) : (
              <>
                <span className="font-bold text-text-primary">{reviews.length.toLocaleString()}</span>{" "}
                reviews total
                {problemReviewCount > 0 && (
                  <> · <span className="font-bold text-text-primary">{problemReviewCount.toLocaleString()}</span> with detected problems</>
                )}
              </>
            )}
          </p>
        </div>

        {paginatedReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-bg-secondary rounded-xl border border-border">
            <span className="text-3xl">🔍</span>
            <div>
              <p className="text-[15px] font-semibold text-text-primary mb-1">No reviews in this category</p>
              <p className="text-sm text-text-tertiary">Try selecting a different category.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {paginatedReviews.map((rev, i) => (
                <BacklogReviewCard
                  key={`${rev.date}-${rev.author}-${i}`}
                  review={rev}
                  onCategoryClick={(cat) => {
                    setActiveCategories(new Set([cat]));
                  }}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-sm text-text-tertiary">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
