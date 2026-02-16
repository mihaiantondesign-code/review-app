"use client";

import { useState, useEffect, useMemo, useCallback, useRef, type ReactElement } from "react";
import { useAppStore } from "@/store/useAppStore";
import { analyzeThemes, analyzeKeywords } from "@/lib/api";
import { classifyBatchWithEvidence } from "@/lib/classifier";
import type { ClassifyEvidence } from "@/lib/classifier";
import { ProblemChip, CATEGORY_CONFIG } from "@/components/shared/ProblemChip";
import { InsightSection } from "@/components/insights/InsightSection";
import { InsightQueryBar } from "@/components/insights/InsightQueryBar";
import { useInsightQuery } from "@/hooks/useInsightQuery";
import { StarRating } from "@/components/shared/StarRating";
import { formatDate } from "@/lib/utils";
import type { ProblemCategory, InsightDimension, Review } from "@/types";

// ─── Constants (Backlog) ──────────────────────────────────────────────────────

const ALL_CATEGORIES: ProblemCategory[] = [
  "BUGS_TECNICI",
  "ONBOARDING_SETUP",
  "UX_USABILITA",
  "FEATURES_FUNZIONALITA",
  "CUSTOMER_SUPPORT",
];

const CATEGORY_ICONS: Record<ProblemCategory, ReactElement> = {
  BUGS_TECNICI: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  ONBOARDING_SETUP: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  UX_USABILITA: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  FEATURES_FUNZIONALITA: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  CUSTOMER_SUPPORT: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
};

// ─── Keyword highlight util ───────────────────────────────────────────────────

/**
 * Returns an array of { text, highlightBg, highlightColor } segments.
 * Accepts per-category keyword layers so each match gets the category's color.
 */
function buildHighlightSegments(
  text: string,
  layers: { stems: string[]; bg: string; color: string }[]
): { text: string; highlightBg: string | null; highlightColor: string | null }[] {
  if (!layers.length) return [{ text, highlightBg: null, highlightColor: null }];

  // Normalize accents helper (mirror of classifier's normalize)
  const normChar = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const normText = normChar(text);

  // Build match spans [start, end, bg, color) — first layer wins on overlap
  type Span = [number, number, string, string];
  const spans: Span[] = [];

  for (const { stems, bg, color } of layers) {
    for (const stem of stems) {
      const normStem = normChar(stem);
      if (!normStem) continue;
      let pos = 0;
      while (pos < normText.length) {
        const idx = normText.indexOf(normStem, pos);
        if (idx === -1) break;
        const isPhrase = stem.includes(" ");
        if (isPhrase) {
          spans.push([idx, idx + normStem.length, bg, color]);
        } else {
          const before = idx === 0 ? "" : normText[idx - 1];
          if (!before || !/[a-z]/.test(before)) {
            spans.push([idx, idx + normStem.length, bg, color]);
          }
        }
        pos = idx + normStem.length;
      }
    }
  }

  if (!spans.length) return [{ text, highlightBg: null, highlightColor: null }];

  // Sort by start, then merge overlapping spans (keep first-encountered color)
  spans.sort((a, b) => a[0] - b[0]);
  const merged: Span[] = [];
  for (const [s, e, bg, color] of spans) {
    if (merged.length && s < merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e, bg, color]);
    }
  }

  // Build segments from original text
  const result: { text: string; highlightBg: string | null; highlightColor: string | null }[] = [];
  let cursor = 0;
  for (const [s, e, bg, color] of merged) {
    if (s > cursor) result.push({ text: text.slice(cursor, s), highlightBg: null, highlightColor: null });
    result.push({ text: text.slice(s, e), highlightBg: bg, highlightColor: color });
    cursor = e;
  }
  if (cursor < text.length) result.push({ text: text.slice(cursor), highlightBg: null, highlightColor: null });
  return result;
}

// ─── Highlighted text renderer ────────────────────────────────────────────────

function HighlightedText({
  text,
  layers,
  className,
}: {
  text: string;
  layers: { stems: string[]; bg: string; color: string }[];
  className?: string;
}) {
  const segments = useMemo(
    () => buildHighlightSegments(text, layers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, JSON.stringify(layers)]
  );

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.highlightBg ? (
          <mark
            key={i}
            className="rounded-sm px-0.5 py-px"
            style={{
              backgroundColor: seg.highlightBg,
              color: seg.highlightColor ?? "inherit",
              fontWeight: 600,
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}

// ─── Backlog review card (with keyword highlights) ────────────────────────────

interface ClassifiedReviewWithEvidence extends Review {
  problem_categories: ProblemCategory[];
  matchedKeywords: Partial<Record<ProblemCategory, string[]>>;
  confidence: number;
  needsReview: boolean;
  sentiment: "positive" | "negative" | "neutral";
}

function BacklogReviewCard({
  review,
  activeCategories,
  onCategoryClick,
}: {
  review: ClassifiedReviewWithEvidence;
  activeCategories: Set<ProblemCategory>;
  onCategoryClick: (cat: ProblemCategory) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.review.length > 220;
  const truncated = !isLong || expanded ? review.review : review.review.slice(0, 220) + "…";
  const sentimentLabel = review.rating >= 4 ? "Positive" : review.rating <= 2 ? "Negative" : "Neutral";
  const sentimentColor = review.rating >= 4 ? "text-[#34C759]" : review.rating <= 2 ? "text-[#FF3B30]" : "text-text-secondary";

  // Which categories to show: if filter is active, only show matched active categories
  const visibleCategories = useMemo(() => {
    if (activeCategories.size === 0) return review.problem_categories;
    return review.problem_categories.filter((cat) => activeCategories.has(cat));
  }, [review.problem_categories, activeCategories]);

  // Build per-category color layers for highlights (only visible categories)
  const highlightLayers = useMemo(() => {
    return visibleCategories.flatMap((cat) => {
      const kws = review.matchedKeywords[cat];
      if (!kws || kws.length === 0) return [];
      const cfg = CATEGORY_CONFIG[cat];
      // Use a slightly stronger bg for readability
      return [{ stems: kws, bg: cfg.bg, color: cfg.color }];
    });
  }, [visibleCategories, review.matchedKeywords]);

  return (
    <div className="bg-bg-primary rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} size="sm" />
          </div>
          <h4 className="text-[16px] font-semibold text-[#0051B3] mb-1.5 leading-snug">{review.title || "(no title)"}</h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            <HighlightedText text={truncated} layers={highlightLayers} />
            {isLong && (
              <button onClick={() => setExpanded((v) => !v)} className="ml-1 text-accent text-sm font-medium hover:underline">
                {expanded ? "less" : "more"}
              </button>
            )}
          </p>
          {review.needsReview && visibleCategories.length > 0 && (
            <p className="mt-1.5 text-[11px] font-medium text-[#b45309]">
              ⚠ Verifica consigliata
            </p>
          )}
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
          {visibleCategories.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm font-semibold uppercase tracking-[0.06em] text-text-tertiary">Problem</p>
                {/* Confidence badge */}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={
                    review.confidence >= 0.7
                      ? { backgroundColor: "rgba(34,197,94,0.12)", color: "#16a34a" }
                      : review.confidence >= 0.4
                      ? { backgroundColor: "rgba(234,179,8,0.15)", color: "#b45309" }
                      : { backgroundColor: "rgba(239,68,68,0.10)", color: "#dc2626" }
                  }
                >
                  {Math.round(review.confidence * 100)}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {visibleCategories.map((cat) => (
                  <ProblemChip key={cat} category={cat} size="xs" onClick={() => onCategoryClick(cat)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Insight review card (slim, no categories) ───────────────────────────────

function InsightReviewCard({ review }: { review: Review }) {
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
        <div className="flex sm:flex-col gap-x-4 gap-y-2 flex-wrap sm:shrink-0 sm:w-[148px] sm:border-l sm:border-border sm:pl-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
          {[
            { label: "Published", value: formatDate(review.date) },
            { label: "Author", value: review.author || "—" },
            { label: "Sentiment", value: sentimentLabel, valueClass: sentimentColor },
          ].map(({ label, value, valueClass }) => (
            <div key={label}>
              <p className="text-sm font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-0.5">{label}</p>
              <p className={`text-sm font-medium truncate ${valueClass ?? "text-text-primary"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Backlog sub-components ───────────────────────────────────────────────────

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full">
      <div className="bg-[#34C759] h-full transition-all" style={{ width: `${positive}%` }} />
      <div className="bg-[rgba(0,0,0,0.12)] h-full transition-all" style={{ width: `${neutral}%` }} />
      <div className="bg-[#FF3B30] h-full transition-all" style={{ width: `${negative}%` }} />
    </div>
  );
}

function CategoryCard({
  category, count, total, sentiment, topTopics, isActive, onViewReviews,
}: {
  category: ProblemCategory; count: number; total: number;
  sentiment: { positive: number; neutral: number; negative: number };
  topTopics: string[]; isActive: boolean; onViewReviews: () => void;
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
            {CATEGORY_ICONS[category]}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-text-primary leading-tight">{cfg.label}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{pct}% of reviews</p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-[32px] font-bold text-text-primary leading-none tabular-nums">{count.toLocaleString()}</p>
        <p className="text-xs text-text-tertiary mt-1">reviews with this problem</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <SentimentBar positive={sentiment.positive} neutral={sentiment.neutral} negative={sentiment.negative} />
        <div className="flex justify-between text-[10px] text-text-tertiary">
          <span>{sentiment.positive}% positive</span>
          <span>{sentiment.negative}% negative</span>
        </div>
      </div>
      {topTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topTopics.map((t) => (
            <span key={t} className="px-2 py-0.5 text-[11px] font-medium bg-bg-secondary text-text-secondary rounded-full">{t}</span>
          ))}
        </div>
      )}
      <button type="button" onClick={onViewReviews} className="mt-auto text-sm font-semibold text-accent hover:underline text-left">
        View reviews →
      </button>
    </div>
  );
}

function SummaryBar({
  categoryCounts, activeCategories, onToggle,
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
            key={cat} type="button" onClick={() => onToggle(cat)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 active:scale-[0.97] ${isActive ? "shadow-sm" : "hover:opacity-80"}`}
            style={isActive
              ? { color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }
              : { color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-secondary)", borderColor: "transparent" }}
          >
            {cfg.shortLabel}
            <span className="tabular-nums text-[11px] font-bold opacity-70">{count.toLocaleString()}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main AnalysisSection ─────────────────────────────────────────────────────

export function AnalysisSection() {
  const { reviews } = useAppStore();

  // ── Insights state ────────────────────────────────────────────────────────
  const { query, toggleInclude, toggleExclude, clearItem, clearAll, setMatchMode, hasActiveQuery, totalIncluded } = useInsightQuery();

  const [topicsItems, setTopicsItems] = useState<{ label: string; count: number }[]>([]);
  const [customTopicsItems, setCustomTopicsItems] = useState<{ label: string; count: number }[]>([]);
  const [tagsItems, setTagsItems] = useState<{ label: string; count: number }[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [customTopicsLoading, setCustomTopicsLoading] = useState(false);

  // Pagination for insights list
  const [insightPage, setInsightPage] = useState(1);
  const INSIGHT_PAGE_SIZE = 20;

  // Tags computed client-side
  const tagsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const rev of reviews) {
      const starTag = `${rev.rating}★`;
      map.set(starTag, (map.get(starTag) ?? 0) + 1);
      const sentTag = rev.rating >= 4 ? "Positive" : rev.rating <= 2 ? "Negative" : "Neutral";
      map.set(sentTag, (map.get(sentTag) ?? 0) + 1);
    }
    return map;
  }, [reviews]);

  useEffect(() => {
    setTagsItems(Array.from(tagsMap.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count));
  }, [tagsMap]);

  useEffect(() => {
    if (reviews.length === 0) { setTopicsItems([]); return; }
    setTopicsLoading(true);
    analyzeThemes(reviews, 1, 5)
      .then((themes) => setTopicsItems(themes.map((t) => ({ label: t.theme, count: t.matching_count })).sort((a, b) => b.count - a.count).slice(0, 50)))
      .catch(() => setTopicsItems([]))
      .finally(() => setTopicsLoading(false));
  }, [reviews]);

  useEffect(() => {
    if (reviews.length === 0) { setCustomTopicsItems([]); return; }
    setCustomTopicsLoading(true);
    analyzeKeywords(reviews.map((r) => r.review).filter(Boolean), 50)
      .then((keywords) => setCustomTopicsItems(keywords.map((k) => ({ label: k.word, count: k.count }))))
      .catch(() => setCustomTopicsItems([]))
      .finally(() => setCustomTopicsLoading(false));
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!hasActiveQuery) return reviews;
    const reviewMatchesLabel = (rev: Review, dim: InsightDimension, label: string): boolean => {
      if (dim === "tags") {
        return `${rev.rating}★` === label || (rev.rating >= 4 ? "Positive" : rev.rating <= 2 ? "Negative" : "Neutral") === label;
      }
      const reviewText = (rev.title + " " + rev.review).toLowerCase();
      return reviewText.includes(label.toLowerCase());
    };
    const includeLabels = (["topics", "custom_topics", "tags"] as InsightDimension[]).flatMap((dim) => query.include[dim].map((label) => ({ dim, label })));
    const excludeLabels = (["topics", "custom_topics", "tags"] as InsightDimension[]).flatMap((dim) => query.exclude[dim].map((label) => ({ dim, label })));
    return reviews.filter((rev) => {
      for (const { dim, label } of excludeLabels) { if (reviewMatchesLabel(rev, dim, label)) return false; }
      if (includeLabels.length === 0) return true;
      return query.match_mode === "ANY"
        ? includeLabels.some(({ dim, label }) => reviewMatchesLabel(rev, dim, label))
        : includeLabels.every(({ dim, label }) => reviewMatchesLabel(rev, dim, label));
    });
  }, [reviews, query, hasActiveQuery]);

  useEffect(() => { setInsightPage(1); }, [query]);

  const insightTotalPages = Math.ceil(filteredReviews.length / INSIGHT_PAGE_SIZE);
  const insightPaginated = filteredReviews.slice((insightPage - 1) * INSIGHT_PAGE_SIZE, insightPage * INSIGHT_PAGE_SIZE);

  // ── Backlog state ─────────────────────────────────────────────────────────
  const [hasClassified, setHasClassified] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<ProblemCategory>>(new Set());
  const backlogListRef = useRef<HTMLDivElement>(null);
  const [backlogPage, setBacklogPage] = useState(1);
  const BACKLOG_PAGE_SIZE = 20;

  useEffect(() => { setHasClassified(false); setActiveCategories(new Set()); }, [reviews]);

  const classifiedReviews = useMemo<ClassifiedReviewWithEvidence[]>(() => {
    if (!hasClassified || reviews.length === 0) return [];
    const results: ClassifyEvidence[] = classifyBatchWithEvidence(reviews);
    return reviews.map((r, i) => ({
      ...r,
      problem_categories: results[i].categories,
      matchedKeywords: results[i].matchedKeywords,
      confidence: results[i].confidence,
      needsReview: results[i].needsReview,
      sentiment: results[i].sentiment,
    }));
  }, [reviews, hasClassified]);

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<ProblemCategory, number>;
    for (const cat of ALL_CATEGORIES) counts[cat] = 0;
    for (const rev of classifiedReviews) {
      for (const cat of rev.problem_categories) counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [classifiedReviews]);

  const categoryStats = useMemo(() => {
    return ALL_CATEGORIES.map((cat) => {
      const catRevs = classifiedReviews.filter((r) => r.problem_categories.includes(cat));
      const count = catRevs.length;
      const posCount = catRevs.filter((r) => r.rating >= 4).length;
      const negCount = catRevs.filter((r) => r.rating <= 2).length;
      const neutCount = count - posCount - negCount;
      const sentiment = count > 0
        ? { positive: Math.round((posCount / count) * 100), neutral: Math.round((neutCount / count) * 100), negative: Math.round((negCount / count) * 100) }
        : { positive: 0, neutral: 0, negative: 100 };
      const wordFreq = new Map<string, number>();
      for (const rev of catRevs) {
        const words = rev.review.toLowerCase().match(/[a-z]{4,}/g) ?? [];
        const SW = new Set(["che","non","per","con","una","uno","gli","del","della","delle","dei","dal","dalla","nel","nella","sul","sulla","sono","questo","questa","questi","queste","anche","come","quando","dove","cosa","tutto","tutti","tutte","molto","avevo","aveva","hanno","fare","fatto","dopo","prima","sempre","solo","mai","ancora","very","this","that","with","have","from","just","like","also","what","does","dont","cant"]);
        for (const w of words) { if (!SW.has(w)) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1); }
      }
      const topTopics = Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
      return { category: cat, count, sentiment, topTopics };
    });
  }, [classifiedReviews]);

  const backlogFiltered = useMemo(() => {
    if (activeCategories.size === 0) return classifiedReviews;
    return classifiedReviews.filter((r) => r.problem_categories.some((cat) => activeCategories.has(cat)));
  }, [classifiedReviews, activeCategories]);

  useEffect(() => { setBacklogPage(1); }, [activeCategories]);

  const backlogTotalPages = Math.ceil(backlogFiltered.length / BACKLOG_PAGE_SIZE);
  const backlogPaginated = backlogFiltered.slice((backlogPage - 1) * BACKLOG_PAGE_SIZE, backlogPage * BACKLOG_PAGE_SIZE);

  const toggleCategory = useCallback((cat: ProblemCategory) => {
    setActiveCategories((prev) => { const next = new Set(prev); if (next.has(cat)) next.delete(cat); else next.add(cat); return next; });
  }, []);

  const handleViewReviews = useCallback((cat: ProblemCategory) => {
    setActiveCategories(new Set([cat]));
    setTimeout(() => { backlogListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
  }, []);

  const problemReviewCount = classifiedReviews.filter((r) => r.problem_categories.length > 0).length;

  // ── Empty state ───────────────────────────────────────────────────────────
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <span className="text-5xl">📊</span>
        <div>
          <p className="text-[17px] font-semibold text-text-primary mb-1">No reviews loaded yet</p>
          <p className="text-sm text-text-tertiary">Fetch App Store reviews first to explore insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-text-primary tracking-tight mb-1">Analysis</h1>
        <p className="text-sm text-text-secondary">Esplora le recensioni per topic, keyword e categorie di problema</p>
      </div>

      {/* ══ INSIGHTS SECTION ═══════════════════════════════════════════════════ */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <InsightQueryBar query={query} onClearItem={clearItem} onClearAll={clearAll} onSetMatchMode={setMatchMode} totalIncluded={totalIncluded} />
      </div>

      <div className="flex flex-col gap-4 mt-6">
        <InsightSection title="Topics" items={topicsItems} query={query} dimension="topics" onToggleInclude={(d, l) => toggleInclude(d, l)} onToggleExclude={(d, l) => toggleExclude(d, l)} onClearItem={clearItem} isLoading={topicsLoading} />
        <InsightSection title="Keywords" items={customTopicsItems} query={query} dimension="custom_topics" onToggleInclude={(d, l) => toggleInclude(d, l)} onToggleExclude={(d, l) => toggleExclude(d, l)} onClearItem={clearItem} isLoading={customTopicsLoading} />
        <InsightSection title="Tags" items={tagsItems} query={query} dimension="tags" onToggleInclude={(d, l) => toggleInclude(d, l)} onToggleExclude={(d, l) => toggleExclude(d, l)} onClearItem={clearItem} isLoading={false} />
      </div>

      {totalIncluded >= 2 && (
        <p className="mt-4 text-xs text-text-tertiary">
          <span className="font-semibold">ANY</span> = almeno una selezione · <span className="font-semibold">ALL</span> = tutte le selezioni
        </p>
      )}

      {/* Insight filtered review listing */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-text-secondary">
            {hasActiveQuery ? (
              <>Showing <span className="font-bold text-text-primary">{filteredReviews.length.toLocaleString()}</span> reviews matching your selection</>
            ) : (
              <><span className="font-bold text-text-primary">{reviews.length.toLocaleString()}</span> reviews total — select topics, keywords or tags to filter</>
            )}
          </p>
        </div>
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-bg-secondary rounded-xl border border-border">
            <span className="text-3xl">🔍</span>
            <div>
              <p className="text-[15px] font-semibold text-text-primary mb-1">No reviews match your selection</p>
              <p className="text-sm text-text-tertiary">Try a different combination or clear some filters.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {insightPaginated.map((rev, i) => <InsightReviewCard key={`${rev.date}-${rev.author}-${i}`} review={rev} />)}
            </div>
            {insightTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <button onClick={() => setInsightPage((p) => Math.max(1, p - 1))} disabled={insightPage === 1} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">← Previous</button>
                <span className="text-sm text-text-tertiary">Page {insightPage} of {insightTotalPages}</span>
                <button onClick={() => setInsightPage((p) => Math.min(insightTotalPages, p + 1))} disabled={insightPage === insightTotalPages} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ DIVIDER ════════════════════════════════════════════════════════════ */}
      <div className="my-10 border-t border-border" />

      {/* ══ BACKLOG SECTION ════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <h2 className="text-[18px] font-bold text-text-primary tracking-tight mb-1">Backlog</h2>
        <p className="text-sm text-text-secondary">Categorie di problemi estratte dalle recensioni per il prossimo sprint</p>
      </div>

      {/* CTA gate */}
      {!hasClassified && (
        <div className="flex flex-col items-center justify-center py-16 gap-5 rounded-2xl border border-dashed border-border bg-bg-secondary text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-primary border border-border flex items-center justify-center text-3xl shadow-sm">🗂</div>
          <div>
            <p className="text-[17px] font-semibold text-text-primary mb-1">
              Classifica {reviews.length.toLocaleString()} recensioni
            </p>
            <p className="text-sm text-text-tertiary max-w-sm mx-auto mb-4">
              Analisi locale con stemming italiano — nessuna API richiesta.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mb-1">
              {ALL_CATEGORIES.map((cat) => (
                <span key={cat} className="px-2.5 py-1 text-xs font-semibold rounded-full border" style={{ color: CATEGORY_CONFIG[cat].color, backgroundColor: CATEGORY_CONFIG[cat].bg, borderColor: CATEGORY_CONFIG[cat].border }}>
                  {CATEGORY_CONFIG[cat].label}
                </span>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setHasClassified(true)} className="px-6 py-3 text-sm font-semibold text-white bg-text-primary rounded-pill hover:opacity-90 active:scale-[0.97] transition-all shadow-sm">
            Get Clusterization
          </button>
        </div>
      )}

      {/* Full backlog body */}
      {hasClassified && (
        <>
          <div className="mb-6">
            <SummaryBar categoryCounts={categoryCounts} activeCategories={activeCategories} onToggle={toggleCategory} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {categoryStats.sort((a, b) => b.count - a.count).map((stat) => (
              <CategoryCard
                key={stat.category}
                category={stat.category}
                count={stat.count}
                total={reviews.length}
                sentiment={stat.sentiment}
                topTopics={stat.topTopics}
                isActive={activeCategories.has(stat.category)}
                onViewReviews={() => handleViewReviews(stat.category)}
              />
            ))}
          </div>

          {/* Active filter bar */}
          {activeCategories.size > 0 && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-sm text-text-secondary">Filtering by:</span>
              {Array.from(activeCategories).map((cat) => <ProblemChip key={cat} category={cat} size="sm" />)}
              <button type="button" onClick={() => setActiveCategories(new Set())} className="text-xs font-medium text-text-tertiary hover:text-text-primary ml-1">Clear</button>
            </div>
          )}

          {/* Backlog review listing */}
          <div ref={backlogListRef}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-text-secondary">
                {activeCategories.size > 0 ? (
                  <>Showing <span className="font-bold text-text-primary">{backlogFiltered.length.toLocaleString()}</span> reviews with {Array.from(activeCategories).map((c) => CATEGORY_CONFIG[c].label).join(", ")} problems</>
                ) : (
                  <><span className="font-bold text-text-primary">{reviews.length.toLocaleString()}</span> reviews total · <span className="font-bold text-text-primary">{problemReviewCount.toLocaleString()}</span> with detected problems</>
                )}
              </p>
            </div>
            {backlogPaginated.length === 0 ? (
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
                  {backlogPaginated.map((rev, i) => (
                    <BacklogReviewCard
                      key={`${rev.date}-${rev.author}-${i}`}
                      review={rev}
                      activeCategories={activeCategories}
                      onCategoryClick={(cat) => setActiveCategories(new Set([cat]))}
                    />
                  ))}
                </div>
                {backlogTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <button onClick={() => setBacklogPage((p) => Math.max(1, p - 1))} disabled={backlogPage === 1} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">← Previous</button>
                    <span className="text-sm text-text-tertiary">Page {backlogPage} of {backlogTotalPages}</span>
                    <button onClick={() => setBacklogPage((p) => Math.min(backlogTotalPages, p + 1))} disabled={backlogPage === backlogTotalPages} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
