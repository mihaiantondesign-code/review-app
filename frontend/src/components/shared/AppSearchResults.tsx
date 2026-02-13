"use client";

import { AppCard } from "./AppCard";
import type { AppSearchResult } from "@/types";

interface AppSearchResultsProps {
  results: AppSearchResult[];
  onSelect: (app: AppSearchResult) => void;
}

export function AppSearchResults({ results, onSelect }: AppSearchResultsProps) {
  if (results.length === 0) {
    return <p className="text-[13px] text-text-secondary px-1">No apps found.</p>;
  }

  return (
    <div className="max-h-[340px] overflow-y-auto space-y-0.5">
      {results.map((app, i) => (
        <AppCard key={`${app.id}-${i}`} app={app} onClick={() => onSelect(app)} />
      ))}
    </div>
  );
}
