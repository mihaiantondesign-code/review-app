"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { lookupApp, getAppStoreSSEUrl } from "@/lib/api";
import { consumeSSE } from "@/lib/sse";
import type { Review } from "@/types";

export function useCompare() {
  const abortRef = useRef<(() => void) | null>(null);
  const {
    compApps,
    setCompData,
    setCompNames,
    setCompFetched,
    setIsCompFetching,
    setCompProgress,
  } = useAppStore();

  const compare = useCallback(
    async (country: string, maxPages: number, cutoffDays: number) => {
      const validApps = compApps.filter((a) => a !== null);
      if (validApps.length < 2) return;

      setIsCompFetching(true);
      setCompFetched(false);

      const allData: Record<string, Review[]> = {};
      const allNames: Record<string, string> = {};

      for (let i = 0; i < validApps.length; i++) {
        const app = validApps[i]!;
        setCompProgress({
          page: i + 1,
          total_pages: validApps.length,
          reviews_so_far: 0,
          message: `Fetching ${app.name}...`,
        });

        // Look up name
        try {
          const info = await lookupApp(app.id, country);
          allNames[app.id] = info.name;
        } catch {
          allNames[app.id] = app.name;
        }

        // Fetch reviews via SSE
        const reviews = await new Promise<Review[]>((resolve) => {
          const url = getAppStoreSSEUrl(app.id, country, maxPages, cutoffDays);
          abortRef.current = consumeSSE(url, {
            onProgress: (data) => {
              setCompProgress({
                ...data,
                message: `${allNames[app.id]}: page ${data.page}/${data.total_pages}`,
              });
            },
            onComplete: (data) => resolve(data.reviews),
            onError: () => resolve([]),
          });
        });

        allData[app.id] = reviews;
      }

      setCompData(allData);
      setCompNames(allNames);
      setCompFetched(true);
      setIsCompFetching(false);
      setCompProgress(null);
    },
    [compApps, setCompData, setCompNames, setCompFetched, setIsCompFetching, setCompProgress]
  );

  const cancel = useCallback(() => {
    abortRef.current?.();
    setIsCompFetching(false);
    setCompProgress(null);
  }, [setIsCompFetching, setCompProgress]);

  return { compare, cancel };
}
