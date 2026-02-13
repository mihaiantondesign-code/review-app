"use client";

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

interface RatingDistributionChartProps {
  reviews: Review[];
}

export function RatingDistributionChart({ reviews }: RatingDistributionChartProps) {
  const data = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}★`,
    count: reviews.filter((rev) => rev.rating === r).length,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
        <Bar dataKey="count" fill="#1D1D1F" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
