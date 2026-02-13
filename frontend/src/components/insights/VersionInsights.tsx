"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Review } from "@/types";

interface VersionInsightsProps {
  reviews: Review[];
}

export function VersionInsights({ reviews }: VersionInsightsProps) {
  const versionData = useMemo(() => {
    const withVersion = reviews.filter((r) => r.version !== "N/A");
    if (withVersion.length === 0) return null;

    const grouped: Record<string, { ratings: number[]; earliest: string }> = {};
    for (const r of withVersion) {
      if (!grouped[r.version]) {
        grouped[r.version] = { ratings: [], earliest: r.date };
      }
      grouped[r.version].ratings.push(r.rating);
      if (r.date < grouped[r.version].earliest) {
        grouped[r.version].earliest = r.date;
      }
    }

    const stats = Object.entries(grouped)
      .map(([version, data]) => ({
        version,
        reviews: data.ratings.length,
        avg_rating: +(data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(2),
        earliest: data.earliest,
      }))
      .filter((v) => v.reviews >= 2)
      .sort((a, b) => a.earliest.localeCompare(b.earliest))
      .slice(-15);

    return stats;
  }, [reviews]);

  if (!versionData || versionData.length === 0) {
    return (
      <div>
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
          Version Insights
        </h3>
        <p className="text-sm text-text-secondary bg-bg-secondary rounded-md p-4">
          No version information available in reviews.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
        Version Insights
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        How ratings and review volume vary across app versions.
      </p>

      <p className="text-sm font-semibold text-text-primary mb-2">Average Rating by Version</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={versionData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="version" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          />
          <Bar dataKey="avg_rating" fill="#0071E3" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <p className="text-sm font-semibold text-text-primary mb-2 mt-6">Number of Reviews by Version</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={versionData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="version" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          />
          <Bar dataKey="reviews" fill="#1D1D1F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 border border-border rounded-md overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Version</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Reviews</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {versionData.map((v) => (
              <tr key={v.version} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium">{v.version}</td>
                <td className="px-4 py-2">{v.reviews}</td>
                <td className="px-4 py-2">{v.avg_rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
