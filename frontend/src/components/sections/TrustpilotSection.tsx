"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useFetchTrustpilot } from "@/hooks/useFetchTrustpilot";
import { searchTrustpilot } from "@/lib/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetricCard } from "@/components/shared/MetricCard";
import { ReviewsTable } from "@/components/shared/ReviewsTable";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { exportExcel } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";

// ─── Loading card ─────────────────────────────────────────────────────────────

function FetchingCard() {
  return (
    <div className="flex items-center justify-center min-h-[260px]">
      <div className="rounded-2xl border border-border bg-bg-primary px-10 py-10 flex flex-col items-center gap-5" style={{ boxShadow: "var(--shadow-md)" }}>
        <p className="text-[15px] font-medium text-text-primary tracking-tight">
          We&rsquo;re fetching results
          <span className="inline-flex gap-[3px] ml-1 mb-[1px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="inline-block w-[4px] h-[4px] rounded-full bg-text-primary animate-bounce"
                style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.8s" }} />
            ))}
          </span>
        </p>
        <div className="relative w-40 h-1 rounded-full overflow-hidden bg-[rgba(0,0,0,0.06)]">
          <div className="absolute top-0 left-0 h-full w-1/2 rounded-full"
            style={{ background: "linear-gradient(90deg, var(--accent), var(--primary))", animation: "shimmer 1.4s ease-in-out infinite" }} />
        </div>
        <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
      </div>
    </div>
  );
}

// ─── Company search picker ────────────────────────────────────────────────────

interface TpCompany { name: string; domain: string; logo: string; stars: number; reviews: number; }

function TrustpilotSearchPicker({ selected, onSelect, onClear }: {
  selected: TpCompany | null;
  onSelect: (c: TpCompany) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TpCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract domain from a Trustpilot URL, e.g. "trustpilot.com/review/company.it" → "company.it"
  function extractTpDomain(raw: string): string | null {
    const s = raw.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    const m = s.match(/^trustpilot\.com\/review\/([^/?#\s]+)/i);
    return m ? m[1] : null;
  }

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }

    // If the user pasted a Trustpilot URL, extract the domain and auto-select immediately
    const urlDomain = extractTpDomain(query);
    if (urlDomain) {
      setResults([]);
      setLoading(false);
      onSelect({ name: urlDomain, domain: urlDomain, logo: "", stars: 0, reviews: 0 });
      setQuery("");
      setOpen(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try { setResults(await searchTrustpilot(query.trim())); }
      catch { setResults([]); }
      setLoading(false);
    }, 400);
  }, [query, onSelect]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (selected) {
    return (
      <div className="flex items-center gap-3 px-3 py-3 border border-border rounded-xl bg-bg-primary">
        {selected.logo && <img src={selected.logo} alt="" className="w-9 h-9 rounded-lg shrink-0 object-contain" />}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-text-primary truncate">{selected.name}</p>
          <p className="text-sm text-text-tertiary truncate">{selected.domain}</p>
        </div>
        <button onClick={onClear} className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-xl hover:bg-[rgba(0,0,0,0.05)] transition-colors shrink-0">
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text" value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder="Search company or paste URL…"
        className="w-full px-4 py-3 min-h-[44px] text-[15px] border border-border-strong rounded-xl bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
      />
      {open && query.trim() && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-bg-primary border border-border rounded-sm shadow-lg overflow-hidden">
          {loading && <p className="px-4 py-3 text-sm text-text-tertiary">Searching…</p>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3">
              <p className="text-sm text-text-tertiary mb-1">No results found.</p>
              <p className="text-sm text-text-secondary">Try pasting the full URL: <span className="font-mono text-xs">trustpilot.com/review/company.com</span></p>
            </div>
          )}
          {results.map((r) => (
            <button key={r.domain} type="button"
              onClick={() => { onSelect(r); setQuery(""); setOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[rgba(0,0,0,0.03)] transition-colors text-left"
            >
              {r.logo
                ? <img src={r.logo} alt="" className="w-7 h-7 rounded-sm shrink-0 object-contain" />
                : <div className="w-7 h-7 rounded-sm shrink-0 bg-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-tertiary">{r.name.slice(0, 2).toUpperCase()}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate">{r.name}</p>
                <p className="text-[11px] text-text-tertiary truncate">{r.domain}</p>
              </div>
              {r.reviews > 0 && <span className="text-[11px] text-text-tertiary shrink-0 tabular-nums">{r.reviews.toLocaleString()} reviews</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "", label: "All languages" },
  { code: "en", label: "English" },
  { code: "it", label: "Italian" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "nl", label: "Dutch" },
  { code: "pt", label: "Portuguese" },
];

export function TrustpilotSection() {
  const { trustpilotReviews, trustpilotInfo, tpFetchDone, isTpFetching } = useAppStore();
  const { fetch: fetchTP } = useFetchTrustpilot();

  const [selected, setSelected] = useState<TpCompany | null>(null);
  const [months, setMonths] = useState(12);
  const [maxPages, setMaxPages] = useState(10);
  const [language, setLanguage] = useState("");

  const handleFetch = useCallback(() => {
    if (!selected) return;
    fetchTP(selected.domain, maxPages, months * 30);
  }, [selected, maxPages, months, fetchTP]);

  const handleDownload = async () => {
    try {
      const blob = await exportExcel(trustpilotReviews);
      downloadBlob(blob, "trustpilot_reviews.xlsx");
    } catch (err) { console.error("Download error:", err); }
  };

  return (
    <div>
      {/* ── Controls ── */}
      <section className="mb-8">
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">Trustpilot Reviews</h3>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-5">Search for any company on Trustpilot and fetch their reviews.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[15px] font-semibold text-text-primary mb-2">Company</label>
            <TrustpilotSearchPicker selected={selected} onSelect={setSelected} onClear={() => setSelected(null)} />
          </div>
          <div>
            <label className="block text-[15px] font-semibold text-text-primary mb-2">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 min-h-[44px] text-[15px] border border-border-strong rounded-xl bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all">
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[15px] font-semibold text-text-primary">Months back</label>
              <span className="text-[22px] font-bold text-text-primary tabular-nums">{months}</span>
            </div>
            <input type="range" min={1} max={24} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full accent-text-primary mt-1 h-2" />
          </div>
          <div>
            <label className="block text-[15px] font-semibold text-text-primary mb-2">Max pages</label>
            <input type="number" min={1} max={50} value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))}
              className="w-full px-4 py-3 min-h-[44px] text-[15px] border border-border-strong rounded-xl bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all" />
          </div>
        </div>

        <button onClick={handleFetch} disabled={!selected || isTpFetching}
          className="w-full sm:w-auto py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97] disabled:bg-[rgba(0,0,0,0.06)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:shadow-none">
          {isTpFetching ? "Fetching…" : "Fetch Reviews"}
        </button>
      </section>

      {isTpFetching && <FetchingCard />}

      {!isTpFetching && trustpilotReviews.length === 0 && (
        tpFetchDone
          ? <EmptyState icon="🔍" title="No reviews found" description="Check the domain and try again with a wider time range." tone="action" />
          : <EmptyState icon="💬" title="No Trustpilot data yet" description="Search for a company above and click Fetch Reviews." />
      )}

      {!isTpFetching && trustpilotReviews.length > 0 && (
        <>
          {trustpilotInfo && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                {selected?.logo && <img src={selected.logo} alt="" className="w-10 h-10 rounded-xl shadow-sm shrink-0 object-contain" />}
                <div>
                  <h2 className="text-[22px] font-bold text-text-primary tracking-tight leading-tight">{trustpilotInfo.name}</h2>
                  <p className="text-[13px] text-text-secondary">on Trustpilot</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <MetricCard label="TrustScore" value={`${trustpilotInfo.trustScore.toFixed(1)} / 5`} prominent />
                <MetricCard label="Stars" value={"★".repeat(Math.round(trustpilotInfo.stars))} />
                <MetricCard label="Total Reviews (all time)" value={trustpilotInfo.totalReviews.toLocaleString()} />
              </div>
              <p className="text-[13px] text-text-secondary mt-4">
                Showing <strong>{trustpilotReviews.length}</strong> reviews within the selected time period
              </p>
            </section>
          )}

          <section className="bg-bg-secondary rounded-lg p-4 sm:p-6 mb-8">
            <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-6">Insights</h3>
            <InsightsPanel reviews={trustpilotReviews} source="trustpilot" />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[22px] font-semibold text-text-primary tracking-tight">All Reviews</h3>
              <button onClick={handleDownload} className="py-2 px-5 text-xs font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97]">
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
