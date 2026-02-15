"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { startAppStoreJob, getJobStatus, getJobResult } from "@/lib/api";

const POLL_INTERVAL = 2000; // ms

export function useFetchReviews() {
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const {
    selectedApps,
    countryCode,
    setReviews,
    setFetchDone,
    setFetchProgress,
    setIsFetching,
  } = useAppStore();

  const selectedApp = selectedApps[0] ?? null;

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current);
    cancelledRef.current = true;
  }, []);

  const finish = useCallback((reviews: Parameters<typeof setReviews>[0]) => {
    stopPolling();
    setReviews(reviews);
    setFetchDone(true);
    setIsFetching(false);
    setFetchProgress(null);
  }, [stopPolling, setReviews, setFetchDone, setIsFetching, setFetchProgress]);

  const fetch = useCallback(
    async (maxPages: number, cutoffDays: number) => {
      if (!selectedApp) return;

      stopPolling();
      cancelledRef.current = false;

      setIsFetching(true);
      setFetchDone(false);
      setReviews([]);
      setFetchProgress({ page: 0, total_pages: maxPages, reviews_so_far: 0, message: "Starting..." });

      let jobId: string;
      try {
        const res = await startAppStoreJob(selectedApp.id, countryCode, maxPages, cutoffDays);
        jobId = res.job_id;
      } catch {
        setFetchDone(true);
        setIsFetching(false);
        setFetchProgress(null);
        return;
      }

      let page = 0;
      const poll = async () => {
        if (cancelledRef.current) return;
        try {
          const status = await getJobStatus(jobId);

          if (status.status === "error") {
            finish([]);
            return;
          }

          if (status.status === "done") {
            const result = await getJobResult(jobId);
            finish(result.reviews);
            return;
          }

          // Still running — update progress display
          page = Math.min(page + 1, maxPages);
          setFetchProgress({
            page,
            total_pages: maxPages,
            reviews_so_far: status.total,
            message: `Fetching... (${status.total} reviews so far)`,
          });

          pollRef.current = setTimeout(poll, POLL_INTERVAL);
        } catch {
          pollRef.current = setTimeout(poll, POLL_INTERVAL);
        }
      };

      pollRef.current = setTimeout(poll, POLL_INTERVAL);
    },
    [selectedApps, countryCode, setReviews, setFetchDone, setFetchProgress, setIsFetching, finish, stopPolling]
  );

  const cancel = useCallback(() => {
    stopPolling();
    setIsFetching(false);
    setFetchProgress(null);
  }, [stopPolling, setIsFetching, setFetchProgress]);

  return { fetch, cancel };
}
