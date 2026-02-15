"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getAppStoreSSEUrl } from "@/lib/api";
import { consumeSSE } from "@/lib/sse";
import type { Review } from "@/types/index";

export function useFetchReviews() {
  const abortRef = useRef<(() => void) | null>(null);
  const {
    selectedApp,
    countryCode,
    setReviews,
    setFetchDone,
    setFetchProgress,
    setIsFetching,
  } = useAppStore();

  const finish = useCallback((reviews: Review[]) => {
    setReviews(reviews);
    setFetchDone(true);
    setIsFetching(false);
    setFetchProgress(null);
  }, [setReviews, setFetchDone, setIsFetching, setFetchProgress]);

  const fetch = useCallback(
    (maxPages: number, cutoffDays: number) => {
      if (!selectedApp) return;

      abortRef.current?.();

      setIsFetching(true);
      setFetchDone(false);
      setReviews([]);

      const url = getAppStoreSSEUrl(selectedApp.id, countryCode, maxPages, cutoffDays);

      abortRef.current = consumeSSE(url, {
        onProgress: (data) => setFetchProgress(data),
        onComplete: (data) => finish(data.reviews),
        onError: () => {
          setFetchDone(true);
          setIsFetching(false);
          setFetchProgress(null);
        },
      });
    },
    [selectedApp, countryCode, setReviews, setFetchDone, setFetchProgress, setIsFetching, finish]
  );

  const cancel = useCallback(() => {
    abortRef.current?.();
    setIsFetching(false);
    setFetchProgress(null);
  }, [setIsFetching, setFetchProgress]);

  return { fetch, cancel };
}
