"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAppSearch } from "@/hooks/useAppSearch";
import { useCompare } from "@/hooks/useCompare";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetricCard } from "@/components/shared/MetricCard";
import { ProgressOverlay } from "@/components/shared/ProgressOverlay";
import { AppCard } from "@/components/shared/AppCard";
import { AppSearchResults } from "@/components/shared/AppSearchResults";
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
  const [search, setSearch] = useState("");
  const { results, isSearching } = useAppSearch(search, country);

  if (app) {
    return (
      <div className="border border-border rounded-md p-3" style={{ boxShadow: "var(--shadow-sm)" }}>
        <AppCard app={app} selected />
        <div className="flex gap-2 mt-2">
          <button
            onClick={onClear}
            className="flex-1 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-[rgba(0,0,0,0.04)] rounded-sm transition-colors"
          >
            Change
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="flex-1 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-sm transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md p-3" style={{ boxShadow: "var(--shadow-sm)" }}>
      <label className="block text-[13px] font-medium text-text-primary mb-1">
        App {index + 1}
      </label>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (e.target.value.trim().match(/^\d+$/)) {
            onSelect({
              id: e.target.value.trim(),
              name: `App ${e.target.value.trim()}`,
              developer: "",
              icon: "",
              bundle: "",
              price: "Free",
              rating: 0,
              ratings_count: 0,
            });
          }
        }}
        placeholder="Search app name..."
        className="w-full px-3 py-2 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
      />
      {search.trim() && !search.trim().match(/^\d+$/) && (
        <div className="mt-2">
          {isSearching ? (
            <p className="text-xs text-text-secondary">Searching...</p>
          ) : (
            <AppSearchResults results={results} onSelect={onSelect} />
          )}
        </div>
      )}
      {canRemove && (
        <button
          onClick={onRemove}
          className="mt-2 w-full py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-sm transition-colors"
        >
          Remove
        </button>
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
    selectedApp,
  } = useAppStore();

  const { compare } = useCompare();
  const [compMonths, setCompMonths] = useState(12);
  const [compPages, setCompPages] = useState(10);
  const [compCountry, setCompCountry] = useState(countryCode);

  // Initialize first slot with selected app
  const apps = useMemo(() => {
    const a = [...compApps];
    if (a[0] === null && selectedApp) {
      a[0] = selectedApp;
    }
    return a;
  }, [compApps, selectedApp]);

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
    <div className="space-y-6">
      <div>
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
          Compare Multiple Apps
        </h3>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Enter App Store IDs of apps you want to compare. You can find the ID
          in any App Store URL: apps.apple.com/.../id<strong>284882215</strong>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1">
            Country code
          </label>
          <input
            type="text"
            value={compCountry}
            onChange={(e) => setCompCountry(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1">
            Months back: {compMonths}
          </label>
          <input
            type="range"
            min={1}
            max={24}
            value={compMonths}
            onChange={(e) => setCompMonths(Number(e.target.value))}
            className="w-full accent-text-primary mt-2"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1">
            Max pages per app
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={compPages}
            onChange={(e) => setCompPages(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-border-strong rounded-sm bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
          />
        </div>
      </div>

      <h4 className="text-lg font-semibold text-text-primary">Apps to Compare</h4>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="flex gap-4 items-center">
        <button
          onClick={addApp}
          disabled={apps.length >= 10}
          className="py-2 px-4 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-[rgba(0,0,0,0.04)] rounded-pill transition-colors disabled:opacity-30"
        >
          + Add App
        </button>
        <button
          onClick={handleCompare}
          disabled={validIds.length < 2 || isCompFetching}
          className="py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all hover:bg-black hover:shadow-md disabled:bg-[rgba(0,0,0,0.06)] disabled:text-[rgba(0,0,0,0.3)] disabled:cursor-not-allowed"
        >
          {isCompFetching ? "Comparing..." : "Compare Apps"}
        </button>
      </div>

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
    <div className="space-y-6">
      <hr className="border-t border-border" />

      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight">
        Score Overview
      </h3>

      <div className="border border-border rounded-md overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">App</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Reviews</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Avg Rating</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Positive %</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Negative %</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((s) => (
                <tr key={s.aid} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2">{s.total}</td>
                  <td className="px-4 py-2">{s.avg.toFixed(1)}</td>
                  <td className="px-4 py-2">{s.posPct.toFixed(0)}%</td>
                  <td className="px-4 py-2">{s.negPct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-t border-border" />

      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight">
        Rating Distribution Comparison
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

      <hr className="border-t border-border" />

      <HeadToHead compData={compData} compNames={compNames} />

      <hr className="border-t border-border" />

      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight">
        Download Comparison Data
      </h3>
      <button
        onClick={onDownload}
        className="py-2.5 px-6 text-sm font-semibold text-white bg-text-primary rounded-pill transition-all hover:bg-black hover:shadow-md"
      >
        Download all reviews (Excel)
      </button>
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
      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-4">
        Head-to-Head: Problems & Wins
      </h3>

      <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${appList.length}, 1fr)` }}>
        {appList.map(([aid, reviews]) => {
          const name = compNames[aid] || aid;
          const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
          const appThemes = themes[aid];

          return (
            <div key={aid}>
              <h4 className="text-lg font-semibold text-text-primary mb-1">{name}</h4>
              <p className="text-sm text-text-secondary mb-3">
                <strong>{avg.toFixed(1)}</strong> / 5 ({reviews.length} reviews)
              </p>

              <p className="text-sm font-semibold text-text-primary mb-2">Top Problems</p>
              {!appThemes ? (
                <p className="text-xs text-text-secondary">Loading...</p>
              ) : appThemes.problems.length === 0 ? (
                <p className="text-xs text-text-secondary">No major problems found</p>
              ) : (
                <Accordion.Root type="multiple" className="space-y-1">
                  {appThemes.problems.map((p, i) => (
                    <Accordion.Item key={i} value={`p-${i}`} className="border border-border rounded-sm overflow-hidden">
                      <Accordion.Header>
                        <Accordion.Trigger className="w-full px-3 py-2 text-left text-xs font-medium flex justify-between items-center hover:bg-bg-secondary/50 group">
                          <span>&ldquo;{p.theme}&rdquo; ({p.mentions}x)</span>
                          <svg className="w-3 h-3 text-text-secondary group-data-[state=open]:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content className="px-3 pb-2 text-xs text-text-secondary">
                        {p.example_review.slice(0, 200)}{p.example_review.length > 200 ? "..." : ""}
                      </Accordion.Content>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              )}

              <p className="text-sm font-semibold text-text-primary mt-4 mb-2">Top Wins</p>
              {!appThemes ? (
                <p className="text-xs text-text-secondary">Loading...</p>
              ) : appThemes.wins.length === 0 ? (
                <p className="text-xs text-text-secondary">No strong wins found</p>
              ) : (
                <Accordion.Root type="multiple" className="space-y-1">
                  {appThemes.wins.map((w, i) => (
                    <Accordion.Item key={i} value={`w-${i}`} className="border border-border rounded-sm overflow-hidden">
                      <Accordion.Header>
                        <Accordion.Trigger className="w-full px-3 py-2 text-left text-xs font-medium flex justify-between items-center hover:bg-bg-secondary/50 group">
                          <span>&ldquo;{w.theme}&rdquo; ({w.mentions}x)</span>
                          <svg className="w-3 h-3 text-text-secondary group-data-[state=open]:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content className="px-3 pb-2 text-xs text-text-secondary">
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
