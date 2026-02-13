"use client";

import { useState, useEffect } from "react";
import { searchApps } from "@/lib/api";
import type { AppSearchResult } from "@/types";

export function useAppSearch(query: string, country: string) {
  const [results, setResults] = useState<AppSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchApps(query, country);
        setResults(data);
      } catch {
        setResults([]);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, country]);

  return { results, isSearching };
}
