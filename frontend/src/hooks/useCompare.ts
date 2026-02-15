"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { startAppStoreJob, getJobStatus, getJobResult } from "@/lib/api";
import type { Review } from "@/types";

const POLL_INTERVAL = 2000;

async function pollUntilDone(jobId: string, cancelledRef: React.MutableRefObject<boolean>): Promise<Review[]> {
  while (true) {
    if (cancelledRef.current) return [];
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    try {
      const status = await getJobStatus(jobId);
      if (status.status === "error") return [];
      if (status.status === "done") {
        const result = await getJobResult(jobId);
        return result.reviews as Review[];
      }
    } catch {
      // network hiccup — keep polling
    }
  }
}

export function useCompare() {
  const cancelledRef = useRef(false);
  const {
    compApps,
    selectedApps,
    setCompData,
    setCompNames,
    setCompFetched,
    setIsCompFetching,
    setCompProgress,
  } = useAppStore();

  const compare = useCallback(
    async (country: string, maxPages: number, cutoffDays: number) => {
      // Use selectedApps from sidebar if ≥2, otherwise fall back to compApps slots
      const source = selectedApps.length >= 2 ? selectedApps : compApps.filter(Boolean);
      const validApps = (source as NonNullable<typeof source[0]>[]).filter(Boolean);
      if (validApps.length < 2) return;

      cancelledRef.current = false;
      setIsCompFetching(true);
      setCompFetched(false);

      const allData: Record<string, Review[]> = {};
      const allNames: Record<string, string> = {};

      for (let i = 0; i < validApps.length; i++) {
        if (cancelledRef.current) break;
        const app = validApps[i];

        allNames[app.id] = app.name;
        setCompProgress({
          page: i + 1,
          total_pages: validApps.length,
          reviews_so_far: Object.values(allData).reduce((s, r) => s + r.length, 0),
          message: `Fetching ${app.name}... (${i + 1}/${validApps.length})`,
        });

        try {
          const { job_id } = await startAppStoreJob(app.id, country, maxPages, cutoffDays);
          const reviews = await pollUntilDone(job_id, cancelledRef);
          allData[app.id] = reviews;
        } catch {
          allData[app.id] = [];
        }
      }

      setCompData(allData);
      setCompNames(allNames);
      setCompFetched(true);
      setIsCompFetching(false);
      setCompProgress(null);
    },
    [compApps, selectedApps, setCompData, setCompNames, setCompFetched, setIsCompFetching, setCompProgress]
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsCompFetching(false);
    setCompProgress(null);
  }, [setIsCompFetching, setCompProgress]);

  return { compare, cancel };
}
