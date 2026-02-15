"use client";

import { useMemo } from "react";
import type { Review } from "@/types";

// ─── Config ────────────────────────────────────────────────────────────────────

const STAR_CATEGORIES = [
  { stars: 5, label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.10)" },
  { stars: 4, label: "Good",      color: "#84cc16", bg: "rgba(132,204,22,0.10)" },
  { stars: 3, label: "Average",   color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  { stars: 2, label: "Poor",      color: "#f97316", bg: "rgba(249,115,22,0.10)" },
  { stars: 1, label: "Terrible",  color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
] as const;

// Very lightweight stopword list (no dep needed)
const STOP = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","is","it",
  "was","are","be","has","had","have","this","that","they","i","my","me","we","you",
  "he","she","his","her","our","their","its","not","no","so","do","did","if","as",
  "by","up","out","from","about","very","just","also","more","get","got","all","can",
  "will","been","would","there","were","what","when","which","who","how","than","then",
  "than","your","some","any","one","two","un","di","il","la","le","lo","gli","ne",
  "che","non","con","per","del","della","dei","degli","delle","della","sono","ho",
  "hai","ha","siamo","avevo","era","mi","ci","si","ma","e","ed","o","se","da","in",
  "su","tra","fra","al","allo","alla","ai","agli","alle","nel","nello","nella","nei",
  "negli","nelle","col","coi","bei","degli","degli","troppo","molto","poco","sempre",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zàèéìòùäöüß\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

function topWords(texts: string[], n = 8): { word: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const t of texts) {
    for (const w of tokenize(t)) {
      freq[w] = (freq[w] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => ({ word, count }));
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface ReviewCategoriesProps {
  reviews: Review[];
}

export function ReviewCategories({ reviews }: ReviewCategoriesProps) {
  const total = reviews.length;

  const data = useMemo(() => {
    return STAR_CATEGORIES.map((cat) => {
      const group = reviews.filter((r) => r.rating === cat.stars);
      const count = group.length;
      const pct = total > 0 ? (count / total) * 100 : 0;
      const texts = group.map((r) => `${r.title} ${r.review}`);
      const keywords = topWords(texts, 8);
      return { ...cat, count, pct, keywords };
    });
  }, [reviews, total]);

  const maxPct = Math.max(...data.map((d) => d.pct), 1);

  return (
    <div>
      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
        Rating Breakdown
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
        Distribution of reviews by star rating with the most common topics per category.
      </p>

      <div className="space-y-3">
        {data.map((cat) => (
          <div key={cat.stars} className="rounded-lg border border-border bg-bg-primary overflow-hidden"
            style={{ boxShadow: "var(--shadow-sm)" }}>
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Star label */}
              <div className="flex items-center gap-1.5 w-[120px] shrink-0">
                <span className="text-[13px] font-semibold text-text-primary">{cat.label}</span>
                <span className="text-[11px] text-text-tertiary tabular-nums">{"★".repeat(cat.stars)}</span>
              </div>

              {/* Bar */}
              <div className="flex-1 relative h-2 rounded-full bg-[rgba(0,0,0,0.05)] overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(cat.pct / maxPct) * 100}%`,
                    background: cat.color,
                    opacity: cat.count === 0 ? 0.2 : 1,
                  }}
                />
              </div>

              {/* Count + pct */}
              <div className="w-[80px] shrink-0 text-right">
                <span className="text-[13px] font-semibold text-text-primary tabular-nums">{cat.count.toLocaleString()}</span>
                <span className="text-[11px] text-text-tertiary ml-1.5">({cat.pct.toFixed(0)}%)</span>
              </div>
            </div>

            {/* Keywords row — only if there are reviews */}
            {cat.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                {cat.keywords.map((kw) => (
                  <span
                    key={kw.word}
                    className="text-[11px] px-2 py-0.5 rounded-pill font-medium"
                    style={{ background: cat.bg, color: cat.color }}
                  >
                    {kw.word}
                    <span className="opacity-60 ml-1">×{kw.count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
