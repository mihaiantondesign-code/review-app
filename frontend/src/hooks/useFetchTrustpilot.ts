"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { startTrustpilotJob, getJobStatus, getJobResult } from "@/lib/api";

const POLL_INTERVAL = 2000;

export function useFetchTrustpilot() {
  const cancelledRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    setTrustpilotReviews,
    setTrustpilotInfo,
    setTpFetchDone,
    setTpFetchProgress,
    setIsTpFetching,
  } = useAppStore();

  const fetch = useCallback(
    async (domain: string, maxPages: number, cutoffDays: number) => {
      if (pollRef.current) clearTimeout(pollRef.current);
      cancelledRef.current = false;

      setIsTpFetching(true);
      setTpFetchDone(false);
      setTrustpilotReviews([]);
      setTrustpilotInfo(null);
      setTpFetchProgress({ page: 0, total_pages: maxPages, reviews_so_far: 0, message: "Starting…" });

      let jobId: string;
      try {
        const res = await startTrustpilotJob(domain, maxPages, cutoffDays);
        jobId = res.job_id;
      } catch {
        setTpFetchDone(true);
        setIsTpFetching(false);
        setTpFetchProgress(null);
        return;
      }

      let tick = 0;
      const poll = async () => {
        if (cancelledRef.current) return;
        try {
          const status = await getJobStatus(jobId);

          if (status.status === "error") {
            setTpFetchDone(true);
            setIsTpFetching(false);
            setTpFetchProgress(null);
            return;
          }

          if (status.status === "done") {
            const result = await getJobResult(jobId);
            setTrustpilotReviews(result.reviews as Parameters<typeof setTrustpilotReviews>[0]);
            if (result.business_info) setTrustpilotInfo(result.business_info);
            setTpFetchDone(true);
            setIsTpFetching(false);
            setTpFetchProgress(null);
            return;
          }

          tick = Math.min(tick + 1, maxPages);
          setTpFetchProgress({
            page: tick,
            total_pages: maxPages,
            reviews_so_far: status.total,
            message: `Fetching… (${status.total} reviews so far)`,
          });
        } catch {
          // network hiccup — keep polling
        }
        pollRef.current = setTimeout(poll, POLL_INTERVAL);
      };

      pollRef.current = setTimeout(poll, POLL_INTERVAL);
    },
    [setTrustpilotReviews, setTrustpilotInfo, setTpFetchDone, setTpFetchProgress, setIsTpFetching]
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (pollRef.current) clearTimeout(pollRef.current);
    setIsTpFetching(false);
    setTpFetchProgress(null);
  }, [setIsTpFetching, setTpFetchProgress]);

  return { fetch, cancel };
}
