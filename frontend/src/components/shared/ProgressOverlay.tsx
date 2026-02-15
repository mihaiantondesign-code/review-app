"use client";

import * as Progress from "@radix-ui/react-progress";
import type { FetchProgress } from "@/types";

interface ProgressOverlayProps {
  progress: FetchProgress;
}

export function ProgressOverlay({ progress }: ProgressOverlayProps) {
  const pct = progress.total_pages > 0
    ? Math.round((progress.page / progress.total_pages) * 100)
    : 0;

  return (
    <div className="rounded-md border border-border p-6 bg-bg-tertiary" style={{ boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-primary">
          {progress.message || `Fetching page ${progress.page}/${progress.total_pages}...`}
        </span>
        <span className="text-sm font-bold text-text-primary tabular-nums">{pct}%</span>
      </div>
      <Progress.Root
        className="relative overflow-hidden rounded-full w-full h-1.5 ring-1 ring-border"
        style={{ background: "rgba(0,0,0,0.03)" }}
        value={pct}
      >
        <Progress.Indicator
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--accent), var(--primary))`,
          }}
        />
      </Progress.Root>
      <p className="text-xs text-text-secondary mt-2.5 tabular-nums">
        {progress.reviews_so_far} reviews fetched
      </p>
    </div>
  );
}
