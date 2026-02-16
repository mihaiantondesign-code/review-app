"use client";

import { useState, useCallback } from "react";
import type { InsightDimension, InsightQuery, MatchMode } from "@/types";

const EMPTY_QUERY: InsightQuery = {
  include: { topics: [], custom_topics: [], tags: [] },
  exclude: { topics: [], custom_topics: [], tags: [] },
  match_mode: "ANY",
};

export function useInsightQuery() {
  const [query, setQuery] = useState<InsightQuery>(EMPTY_QUERY);

  /**
   * Toggle include state for a label in a dimension:
   * - If currently excluded → move to include
   * - If currently included → remove (neutral)
   * - If neutral → add to include
   */
  const toggleInclude = useCallback((dimension: InsightDimension, value: string) => {
    setQuery((prev) => {
      const isIncluded = prev.include[dimension].includes(value);
      const isExcluded = prev.exclude[dimension].includes(value);

      if (isIncluded) {
        // included → neutral: remove from include
        return {
          ...prev,
          include: {
            ...prev.include,
            [dimension]: prev.include[dimension].filter((v) => v !== value),
          },
        };
      }

      if (isExcluded) {
        // excluded → included: remove from exclude, add to include
        return {
          ...prev,
          include: {
            ...prev.include,
            [dimension]: [...prev.include[dimension], value],
          },
          exclude: {
            ...prev.exclude,
            [dimension]: prev.exclude[dimension].filter((v) => v !== value),
          },
        };
      }

      // neutral → included
      return {
        ...prev,
        include: {
          ...prev.include,
          [dimension]: [...prev.include[dimension], value],
        },
      };
    });
  }, []);

  /**
   * Toggle exclude state for a label in a dimension:
   * - If currently included → move to exclude
   * - If currently excluded → remove (neutral)
   * - If neutral → add to exclude
   */
  const toggleExclude = useCallback((dimension: InsightDimension, value: string) => {
    setQuery((prev) => {
      const isIncluded = prev.include[dimension].includes(value);
      const isExcluded = prev.exclude[dimension].includes(value);

      if (isExcluded) {
        // excluded → neutral: remove from exclude
        return {
          ...prev,
          exclude: {
            ...prev.exclude,
            [dimension]: prev.exclude[dimension].filter((v) => v !== value),
          },
        };
      }

      if (isIncluded) {
        // included → excluded: remove from include, add to exclude
        return {
          ...prev,
          include: {
            ...prev.include,
            [dimension]: prev.include[dimension].filter((v) => v !== value),
          },
          exclude: {
            ...prev.exclude,
            [dimension]: [...prev.exclude[dimension], value],
          },
        };
      }

      // neutral → excluded
      return {
        ...prev,
        exclude: {
          ...prev.exclude,
          [dimension]: [...prev.exclude[dimension], value],
        },
      };
    });
  }, []);

  /** Remove a single item from either include or exclude list */
  const clearItem = useCallback((dimension: InsightDimension, value: string) => {
    setQuery((prev) => ({
      ...prev,
      include: {
        ...prev.include,
        [dimension]: prev.include[dimension].filter((v) => v !== value),
      },
      exclude: {
        ...prev.exclude,
        [dimension]: prev.exclude[dimension].filter((v) => v !== value),
      },
    }));
  }, []);

  const clearAll = useCallback(() => {
    setQuery(EMPTY_QUERY);
  }, []);

  const setMatchMode = useCallback((mode: MatchMode) => {
    setQuery((prev) => ({ ...prev, match_mode: mode }));
  }, []);

  const totalIncluded = Object.values(query.include).reduce((s, a) => s + a.length, 0);
  const totalExcluded = Object.values(query.exclude).reduce((s, a) => s + a.length, 0);
  const hasActiveQuery = totalIncluded > 0 || totalExcluded > 0;

  return {
    query,
    toggleInclude,
    toggleExclude,
    clearItem,
    clearAll,
    setMatchMode,
    hasActiveQuery,
    totalIncluded,
    totalExcluded,
  };
}
