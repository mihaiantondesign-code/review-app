"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useCompare } from "@/hooks/useCompare";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetricCard } from "@/components/shared/MetricCard";
import { ProgressOverlay } from "@/components/shared/ProgressOverlay";
import { AppCard } from "@/components/shared/AppCard";
import { AppMultiSelectPicker } from "@/components/shared/AppMultiSelectPicker";
import { exportComparisonExcel, analyzeSentiment, analyzeAdjustedMetrics, analyzeThemes } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import * as Accordion from "@radix-ui/react-accordion";
import type { AppSearchResult, Review, Theme } from "@/types";

const COLORS = ["#1D1D1F", "#0071E3", "#FF3B30", "#34C759", "#FF9500", "#AF52DE", "#5856D6", "#FF2D55", "#00C7BE", "#FF6482"];

function CompAppSlot({
  index,
  app,
  onSelect,
  onClear,
  onRemove,
  canRemove,
  country,
}: {
  index: number;
  app: AppSearchResult | null;
  onSelect: (app: AppSearchResult) => void;
  onClear: () => void;
  onRemove: () => void;
  canRemove: boolean;
  country: string;
}) {
  return (
    <div className="rounded-md p-3 bg-bg-tertiary" style={{ boxShadow: "var(--shadow-sm)" }}>
      <label className="block text-[13px] font-medium text-text-primary mb-1.5">
        App {index + 1}
      </label>

      {app ? (
        <>
          <AppCard app={app} selected />
          <div className="flex gap-2 mt-2">
            <button
              onClick={onClear}
              className="flex-1 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.07)] active:scale-[0.98] rounded-pill transition-all duration-150"
            >
              Change
            </button>
            {canRemove && (
              <button
                onClick={onRemove}
                className="flex-1 py-1.5 text-xs font-medium text-negative hover:bg-negative/5 active:bg-negative/10 active:scale-[0.98] rounded-pill transition-all duration-150"
              >
                Remove
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <AppMultiSelectPicker
            selected={[]}
            onChange={(apps) => apps[0] && onSelect(apps[0])}
            country={country}
            max={1}
            placeholder="Search app name..."
          />
          {canRemove && (
            <button
              onClick={onRemove}
              className="mt-2 w-full py-1.5 text-xs font-medium text-negative hover:bg-negative/5 active:bg-negative/10 active:scale-[0.98] rounded-pill transition-all duration-150"
            >
              Remove
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function ComparisonSection() {
  const {
    compApps,
    setCompApps,
    compData,
    compNames,
    compFetched,
    isCompFetching,
    compProgress,
    countryCode,
    selectedApps,
  } = useAppStore();

  const { compare } = useCompare();
  const [compMonths, setCompMonths] = useState(12);
  const [compPages, setCompPages] = useState(10);
  const [compCountry, setCompCountry] = useState(countryCode);

  // Pre-fill slots from sidebar selectedApps; fall back to stored compApps
  const apps = useMemo(() => {
    // If user has selected apps in the sidebar, use those to seed slots
    if (selectedApps.length > 0) {
      const merged = [...selectedApps] as (typeof selectedApps[0] | null)[];
      // Keep any extra compApps slots that go beyond selectedApps length
      for (let i = selectedApps.length; i < compApps.length; i++) {
        merged.push(compApps[i]);
      }
      // Ensure at least 2 slots
      while (merged.length < 2) merged.push(null);
      return merged;
    }
    return [...compApps];
  }, [compApps, selectedApps]);

  const validIds = apps.filter((a) => a !== null);

  const handleCompare = () => {
    compare(compCountry, compPages, compMonths * 30);
  };

  const handleDownload = async () => {
    try {
      const blob = await exportComparisonExcel(compData, compNames);
      downloadBlob(blob, "comparison_reviews.xlsx");
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const updateApp = (index: number, app: AppSearchResult | null) => {
    const next = [...apps];
    next[index] = app;
    setCompApps(next);
  };

  const removeApp = (index: number) => {
    const next = apps.filter((_, i) => i !== index);
    setCompApps(next);
  };

  const addApp = () => {
    if (apps.length < 10) {
      setCompApps([...apps, null]);
    }
  };

  return (
    <div>
      {/* Input controls */}
      <section className="mb-8">
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
          Compare Multiple Apps
        </h3>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
          Search for apps or enter an App Store ID directly (the number in any App Store URL:
          apps.apple.com/.../id<code className="bg-bg-secondary px-1 py-0.5 rounded-sm font-mono text-xs">284882215</code>).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Country code
            </label>
            <input
              type="text"
              value={compCountry}
              onChange={(e) => setCompCountry(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-medium text-text-primary">
                Months back
              </label>
              <span className="text-[13px] font-bold text-text-primary tabular-nums">{compMonths}</span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              value={compMonths}
              onChange={(e) => setCompMonths(Number(e.target.value))}
              className="w-full accent-text-primary mt-1"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Max pages per app
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={compPages}
              onChange={(e) => setCompPages(Number(e.target.value))}
              className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* App slots */}
      <section className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-3">
          Apps to Compare
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {apps.map((app, idx) => (
            <CompAppSlot
              key={idx}
              index={idx}
              app={app}
              country={compCountry}
              onSelect={(a) => updateApp(idx, a)}
              onClear={() => updateApp(idx, null)}
              onRemove={() => removeApp(idx)}
              canRemove={apps.length > 2}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <button
            onClick={addApp}
            disabled={apps.length >= 10}
            className="py-2 px-4 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.07)] active:scale-[0.97] rounded-pill transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            + Add App
          </button>
          <button
            onClick={handleCompare}
            disabled={validIds.length < 2 || isCompFetching}
            className="w-full sm:w-auto py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97] disabled:bg-[rgba(0,0,0,0.06)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isCompFetching ? "Comparing..." : "Compare Apps"}
          </button>
        </div>
      </section>

      {isCompFetching && compProgress && (
        <ProgressOverlay progress={compProgress} />
      )}

      {compFetched && Object.keys(compData).length > 0 && (
        <ComparisonResults
          compData={compData}
          compNames={compNames}
          onDownload={handleDownload}
        />
      )}

      {!compFetched && !isCompFetching && (
        <EmptyState
          icon="📊"
          title="No comparison data yet"
          description="Enter at least 2 App Store IDs above and click Compare Apps to get started."
        />
      )}
    </div>
  );
}

function ComparisonResults({
  compData,
  compNames,
  onDownload,
}: {
  compData: Record<string, Review[]>;
  compNames: Record<string, string>;
  onDownload: () => void;
}) {
  const summaryData = useMemo(() => {
    return Object.entries(compData).map(([aid, reviews]) => {
      const name = compNames[aid] || aid;
      const total = reviews.length;
      const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
      const posPct = total > 0 ? (reviews.filter((r) => r.rating >= 4).length / total) * 100 : 0;
      const negPct = total > 0 ? (reviews.filter((r) => r.rating <= 2).length / total) * 100 : 0;
      const counts = [1, 2, 3, 4, 5].map((r) =>
        reviews.filter((rev) => rev.rating === r).length
      );
      return { aid, name, total, avg, posPct, negPct, counts };
    });
  }, [compData, compNames]);

  const ratingChartData = useMemo(() => {
    return [1, 2, 3, 4, 5].map((r) => {
      const row: Record<string, string | number> = { rating: `${r}★` };
      for (const s of summaryData) {
        if (s.total > 0) {
          row[s.name] = +((s.counts[r - 1] / s.total) * 100).toFixed(1);
        }
      }
      return row;
    });
  }, [summaryData]);

  return (
    <div>
      {/* Score overview — focal point */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-[20px] sm:text-[22px] font-semibold text-text-primary tracking-tight">
            Score Overview
          </h3>
          <button
            onClick={onDownload}
            className="shrink-0 py-2 px-4 sm:px-5 text-xs font-semibold text-white bg-text-primary rounded-pill transition-all duration-150 hover:bg-black hover:shadow-md active:scale-[0.97]"
          >
            Download
          </button>
        </div>

        {/* Mobile: stacked cards. Desktop: table */}
        <div className="sm:hidden space-y-3">
          {summaryData.map((s, i) => (
            <div key={s.aid} className="rounded-xl border border-border bg-bg-primary p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <p className="text-[14px] font-semibold text-text-primary truncate">{s.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Reviews", value: s.total.toLocaleString() },
                  { label: "Avg Rating", value: `${s.avg.toFixed(1)} ★` },
                  { label: "Positive", value: `${s.posPct.toFixed(0)}%`, color: "text-[#34C759]" },
                  { label: "Negative", value: `${s.negPct.toFixed(0)}%`, color: "text-[#FF3B30]" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-bg-secondary rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-0.5">{label}</p>
                    <p className={`text-[14px] font-semibold tabular-nums ${color ?? "text-text-primary"}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden sm:block rounded-md overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">App</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Reviews</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Avg Rating</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Positive %</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Negative %</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((s) => (
                  <tr key={s.aid} className="border-b border-border last:border-0 hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{s.name}</td>
                    <td className="px-4 py-2.5 tabular-nums">{s.total}</td>
                    <td className="px-4 py-2.5 tabular-nums">{s.avg.toFixed(1)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-positive">{s.posPct.toFixed(0)}%</td>
                    <td className="px-4 py-2.5 tabular-nums text-negative">{s.negPct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Rating distribution chart */}
      <section className="mb-10">
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-4">
          Rating Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ratingChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="rating" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            />
            <Legend />
            {summaryData
              .filter((s) => s.total > 0)
              .map((s, i) => (
                <Bar key={s.aid} dataKey={s.name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Head-to-head — wrapped in bg-bg-secondary for visual separation */}
      <section className="bg-bg-secondary rounded-lg p-4 sm:p-6 mb-10">
        <HeadToHead compData={compData} compNames={compNames} />
      </section>
    </div>
  );
}

function HeadToHead({
  compData,
  compNames,
}: {
  compData: Record<string, Review[]>;
  compNames: Record<string, string>;
}) {
  const appList = Object.entries(compData).filter(([, reviews]) => reviews.length > 0);

  const [themes, setThemes] = useState<Record<string, { problems: Theme[]; wins: Theme[] }>>({});
  const [loaded, setLoaded] = useState(false);

  // Load themes on mount
  useMemo(() => {
    if (loaded) return;
    const loadAll = async () => {
      const result: Record<string, { problems: Theme[]; wins: Theme[] }> = {};
      for (const [aid, reviews] of appList) {
        try {
          const [probs, w] = await Promise.all([
            analyzeThemes(reviews, 1, 2),
            analyzeThemes(reviews, 4, 5),
          ]);
          result[aid] = { problems: probs.slice(0, 3), wins: w.slice(0, 3) };
        } catch {
          result[aid] = { problems: [], wins: [] };
        }
      }
      setThemes(result);
      setLoaded(true);
    };
    if (appList.length >= 2) loadAll();
  }, [appList.length]);

  if (appList.length < 2) {
    return (
      <p className="text-sm text-text-secondary bg-bg-secondary rounded-md p-4">
        Need at least 2 apps with reviews for head-to-head comparison.
      </p>
    );
  }

  return (
    <div>
      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
        Head-to-Head: Problems & Wins
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
        Top recurring themes extracted from 1-2 star and 4-5 star reviews for each app.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {appList.map(([aid, reviews]) => {
          const name = compNames[aid] || aid;
          const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
          const appThemes = themes[aid];

          return (
            <div key={aid}>
              <h4 className="text-base font-semibold text-text-primary mb-0.5">{name}</h4>
              <p className="text-[13px] text-text-secondary mb-4">
                <span className="font-bold text-text-primary tabular-nums">{avg.toFixed(1)}</span> / 5 &middot; {reviews.length} reviews
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-2">Top Problems</p>
              {!appThemes ? (
                <p className="text-xs text-text-secondary">Analyzing themes...</p>
              ) : appThemes.problems.length === 0 ? (
                <p className="text-xs text-text-secondary bg-bg-primary rounded-sm p-2">No major problems found</p>
              ) : (
                <Accordion.Root type="multiple" className="space-y-1.5">
                  {appThemes.problems.map((p, i) => (
                    <Accordion.Item key={i} value={`p-${i}`} className="rounded-md overflow-hidden bg-bg-primary" style={{ boxShadow: "var(--shadow-sm)" }}>
                      <Accordion.Header>
                        <Accordion.Trigger className="w-full px-3 py-2.5 text-left text-xs font-medium flex justify-between items-center hover:bg-[rgba(0,0,0,0.02)] transition-colors group">
                          <span>
                            &ldquo;{p.theme}&rdquo;
                            <span className="text-text-tertiary font-normal ml-1.5">{p.mentions}x</span>
                          </span>
                          <svg className="w-3 h-3 text-text-tertiary group-data-[state=open]:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content className="px-3 pb-2.5 text-xs text-text-secondary leading-relaxed">
                        {p.example_review.slice(0, 200)}{p.example_review.length > 200 ? "..." : ""}
                      </Accordion.Content>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              )}

              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary mt-5 mb-2">Top Wins</p>
              {!appThemes ? (
                <p className="text-xs text-text-secondary">Analyzing themes...</p>
              ) : appThemes.wins.length === 0 ? (
                <p className="text-xs text-text-secondary bg-bg-primary rounded-sm p-2">No strong wins found</p>
              ) : (
                <Accordion.Root type="multiple" className="space-y-1.5">
                  {appThemes.wins.map((w, i) => (
                    <Accordion.Item key={i} value={`w-${i}`} className="rounded-md overflow-hidden bg-bg-primary" style={{ boxShadow: "var(--shadow-sm)" }}>
                      <Accordion.Header>
                        <Accordion.Trigger className="w-full px-3 py-2.5 text-left text-xs font-medium flex justify-between items-center hover:bg-[rgba(0,0,0,0.02)] transition-colors group">
                          <span>
                            &ldquo;{w.theme}&rdquo;
                            <span className="text-text-tertiary font-normal ml-1.5">{w.mentions}x</span>
                          </span>
                          <svg className="w-3 h-3 text-text-tertiary group-data-[state=open]:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content className="px-3 pb-2.5 text-xs text-text-secondary leading-relaxed">
                        {w.example_review.slice(0, 200)}{w.example_review.length > 200 ? "..." : ""}
                      </Accordion.Content>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
