"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { StarRating } from "@/components/shared/StarRating";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { VersionInsights } from "@/components/insights/VersionInsights";
import { analyzeSentiment } from "@/lib/api";
import { exportExcel } from "@/lib/api";
import { downloadBlob, formatDate } from "@/lib/utils";
import type { Review, SentimentResult } from "@/types";

// ─── Loading card ────────────────────────────────────────────────────────────

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

// ─── Sentiment breakdown card ─────────────────────────────────────────────────

function SentimentCard({ reviews, compact = false }: { reviews: Review[]; compact?: boolean }) {
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);

  useEffect(() => {
    if (reviews.length === 0) return;
    const texts = reviews.map((r) => `${r.title} ${r.review}`);
    analyzeSentiment(texts).then(setSentiment).catch(() => {});
  }, [reviews]);

  const total = reviews.length;

  const pos = reviews.filter((r) => r.rating >= 4).length;
  const neg = reviews.filter((r) => r.rating <= 2).length;
  const neu = reviews.filter((r) => r.rating === 3).length;

  const buckets = sentiment
    ? [
        { label: "Positive", count: sentiment.positive, color: "#34C759" },
        { label: "Negative", count: sentiment.negative, color: "#FF3B30" },
      ]
    : [
        { label: "Positive", count: pos, color: "#34C759" },
        { label: "Neutral", count: neu, color: "#8E8E93" },
        { label: "Negative", count: neg, color: "#FF3B30" },
      ];

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-text-tertiary mb-0.5">Sentiment</p>
        {buckets.map((b) => {
          const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
          const barPct = (b.count / maxCount) * 100;
          return (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-[11px] text-text-tertiary w-12 shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barPct}%`, backgroundColor: b.color }} />
              </div>
              <span className="text-[11px] tabular-nums text-text-tertiary w-7 text-right shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-bg-primary rounded-xl border border-border p-4 flex flex-col gap-2.5" style={{ boxShadow: "var(--shadow-sm)" }}>
      <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-text-tertiary mb-1">Sentiment Breakdown</p>
      {buckets.map((b) => {
        const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
        const barPct = (b.count / maxCount) * 100;
        return (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-sm text-text-secondary w-14 shrink-0">{b.label}</span>
            <div className="flex-1 h-2 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barPct}%`, backgroundColor: b.color }} />
            </div>
            <span className="text-sm tabular-nums text-text-secondary w-16 text-right shrink-0 font-medium">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Individual review card ───────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.review.length > 220;
  const text = !isLong || expanded ? review.review : review.review.slice(0, 220) + "…";

  const sentimentLabel = review.rating >= 4 ? "Positive" : review.rating <= 2 ? "Negative" : "Neutral";
  const sentimentColor = review.rating >= 4 ? "text-[#34C759]" : review.rating <= 2 ? "text-[#FF3B30]" : "text-text-secondary";

  return (
    <div className="bg-bg-primary rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <StarRating rating={review.rating} size="sm" colored />
          </div>
          <h4 className="text-[15px] font-semibold text-text-primary mb-1.5 leading-snug">{review.title || "(no title)"}</h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {text}
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="ml-1 text-accent text-sm font-medium hover:underline"
              >
                {expanded ? "less" : "more"}
              </button>
            )}
          </p>
        </div>

        {/* Metadata — row on mobile, sidebar on sm+ */}
        <div className="flex sm:flex-col gap-x-4 gap-y-2 flex-wrap sm:shrink-0 sm:w-[148px] sm:border-l sm:border-border sm:pl-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
          {[
            { label: "Published", value: formatDate(review.date) },
            { label: "Author", value: review.author || "—" },
            { label: "Version", value: review.version || "—" },
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

// ─── Review listings with date grouping ──────────────────────────────────────

function ReviewListings({ reviews, onDownload }: { reviews: Review[]; onDownload: () => void }) {
  const [ratingFilter, setRatingFilter] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let r = reviews.filter((rev) => ratingFilter.has(rev.rating));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(
        (rev) =>
          rev.title.toLowerCase().includes(q) ||
          rev.review.toLowerCase().includes(q) ||
          rev.author.toLowerCase().includes(q)
      );
    }
    return r;
  }, [reviews, ratingFilter, search]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, Review[]>();
    for (const rev of filtered) {
      const day = rev.date.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(rev);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // All reviews flattened, paginated
  const paginatedAll = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Rebuild groups for current page
  const pageGrouped = useMemo(() => {
    const map = new Map<string, Review[]>();
    for (const rev of paginatedAll) {
      const day = rev.date.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(rev);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [paginatedAll]);

  const toggleRating = (r: number) => {
    setRatingFilter((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
      return next;
    });
    setPage(1);
  };

  function friendlyDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  return (
    <section>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold text-[#0051B3] tracking-tight">Review Listings</h3>
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97]"
        >
          Export
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => toggleRating(r)}
                className={`px-3 py-2 text-sm font-medium rounded-pill transition-all duration-150 min-w-[40px] ${
                  ratingFilter.has(r)
                    ? "bg-text-primary text-white shadow-sm"
                    : "bg-[rgba(0,0,0,0.04)] text-text-secondary hover:bg-[rgba(0,0,0,0.07)]"
                }`}
              >
                {r}★
              </button>
            ))}
          </div>
          <span className="text-sm text-text-tertiary tabular-nums sm:hidden">{filtered.length.toLocaleString()} reviews</span>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search reviews…"
          className="w-full sm:flex-1 sm:max-w-[260px] px-4 py-2.5 min-h-[44px] text-sm border border-border-strong rounded-xl bg-bg-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
        />
        <span className="hidden sm:block text-sm text-text-tertiary tabular-nums ml-auto">{filtered.length.toLocaleString()} reviews</span>
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {pageGrouped.map(([day, dayReviews]) => (
          <div key={day}>
            <p className="text-sm font-semibold uppercase tracking-[0.06em] text-text-secondary mb-3">
              {friendlyDate(day)}
            </p>
            <div className="space-y-3">
              {dayReviews.map((rev, i) => (
                <ReviewCard key={`${day}-${i}`} review={rev} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 text-sm font-medium rounded-pill bg-[rgba(0,0,0,0.04)] text-text-secondary hover:bg-[rgba(0,0,0,0.07)] active:scale-[0.97] disabled:opacity-25 disabled:pointer-events-none transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2.5 text-sm font-medium rounded-pill bg-[rgba(0,0,0,0.04)] text-text-secondary hover:bg-[rgba(0,0,0,0.07)] active:scale-[0.97] disabled:opacity-25 disabled:pointer-events-none transition-all"
            >
              Next
            </button>
          </div>
          <span className="text-sm text-text-tertiary tabular-nums">Page {page} of {totalPages}</span>
        </div>
      )}
    </section>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function AppStoreSection({ onDownload }: { onDownload?: () => void }) {
  const { reviews, fetchDone, isFetching, selectedApps } = useAppStore();
  const hasDownloaded = useRef(false);

  const selectedApp = selectedApps[0] ?? null;

  const stats = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.length;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;
    const counts = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: reviews.filter((rev) => rev.rating === r).length,
    }));
    return { total, avg, counts };
  }, [reviews]);

  const handleDownload = async () => {
    try {
      const blob = await exportExcel(reviews);
      downloadBlob(blob, "app_reviews.xlsx");
      if (!hasDownloaded.current) {
        hasDownloaded.current = true;
        onDownload?.();
      }
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  if (isFetching) return <FetchingCard />;

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
      {/* ── Header ── */}
      <div className="mb-6">
        {selectedApp && (
          <div className="flex items-center gap-3 mb-3">
            {selectedApp.icon && (
              <img src={selectedApp.icon} alt="" className="w-10 h-10 rounded-xl shadow-sm shrink-0" />
            )}
            <div>
              <h1 className="text-[22px] font-bold text-text-primary tracking-tight leading-tight">{selectedApp.name}</h1>
              <p className="text-sm text-text-secondary">
                View, search and export reviews with text.
              </p>
            </div>
          </div>
        )}
        {!selectedApp && (
          <>
            <h1 className="text-[22px] font-bold text-text-primary tracking-tight mb-1">Reviews</h1>
            <p className="text-sm text-text-secondary">
              View, search and export reviews with text.
            </p>
          </>
        )}
      </div>

      {/* ── Stats row ── */}
      {stats && (
        <div className="mb-8">
          {/* Hero stat + summary bar */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 mb-6">
            {/* Hero: avg rating */}
            <div className="shrink-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-text-tertiary mb-1">Avg Rating</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[40px] font-bold text-text-primary leading-none tabular-nums">{stats.avg.toFixed(1)}</span>
                <span className="text-lg text-text-tertiary">★</span>
              </div>
              <p className="text-sm text-text-secondary mt-1">{stats.total.toLocaleString()} reviews</p>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch bg-border shrink-0" />

            {/* Stars breakdown inline */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-text-tertiary mb-2">Distribution</p>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => {
                  const c = stats.counts.find((x) => x.rating === s)!;
                  const pct = stats.total > 0 ? (c.count / stats.total) * 100 : 0;
                  const max = Math.max(...stats.counts.map((x) => x.count), 1);
                  const barPct = (c.count / max) * 100;
                  const color = s >= 4 ? "#34C759" : s === 3 ? "#FF9500" : "#FF3B30";
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-text-tertiary w-4 shrink-0 tabular-nums">{s}★</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barPct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[11px] tabular-nums text-text-tertiary w-8 text-right shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch bg-border shrink-0" />

            {/* Sentiment */}
            <div className="shrink-0 sm:w-[180px]">
              <SentimentCard reviews={reviews} compact />
            </div>
          </div>
        </div>
      )}

      {/* ── Insights panel ── */}
      <div className="mb-10">
        <InsightsPanel reviews={reviews} hideStatRow />
      </div>

      {/* ── Version trends ── */}
      <div className="mb-10">
        <VersionInsights reviews={reviews} />
      </div>

      {/* ── Review listings ── */}
      <ReviewListings reviews={reviews} onDownload={handleDownload} />
    </div>
  );
}
