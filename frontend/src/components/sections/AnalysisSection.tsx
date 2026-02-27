"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { analyzeThemes, analyzeKeywords } from "@/lib/api";
import { InsightSection } from "@/components/insights/InsightSection";
import { InsightQueryBar } from "@/components/insights/InsightQueryBar";
import { useInsightQuery } from "@/hooks/useInsightQuery";
import { StarRating } from "@/components/shared/StarRating";
import { formatDate } from "@/lib/utils";
import type { InsightDimension, Review } from "@/types";
import { ComparisonSection } from "@/components/sections/ComparisonSection";

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
          <div className="flex items-center gap-2 mb-1.5">
            <StarRating rating={review.rating} size="sm" colored />
          </div>
          <h4 className="text-[15px] font-semibold text-text-primary mb-1.5 leading-snug">{review.title || "(no title)"}</h4>
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
              <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-text-tertiary mb-0.5">{label}</p>
              <p className={`text-sm font-medium truncate ${valueClass ?? "text-text-primary"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
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
      {/* ══ COMPARISON ══════════════════════════════════════════════════════════ */}
      <ComparisonSection />

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div className="my-10 border-t border-border" />

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

    </div>
  );
}
