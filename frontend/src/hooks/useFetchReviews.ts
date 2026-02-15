"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getAppStoreSSEUrl } from "@/lib/api";
import { consumeSSE } from "@/lib/sse";
import type { Review } from "@/types/index";

export function useFetchReviews() {
  const abortRef = useRef<(() => void) | null>(null);
  const accumulatedRef = useRef<Review[]>([]);
  const {
    selectedApp,
    countryCode,
    setReviews,
    setFetchDone,
    setFetchProgress,
    setIsFetching,
  } = useAppStore();

  const fetch = useCallback(
    (maxPages: number, cutoffDays: number) => {
      if (!selectedApp) return;

      abortRef.current?.();
      accumulatedRef.current = [];

      setIsFetching(true);
      setFetchDone(false);
      setReviews([]);

      const url = getAppStoreSSEUrl(selectedApp.id, countryCode, maxPages, cutoffDays);

      abortRef.current = consumeSSE(url, {
        onProgress: (data) => setFetchProgress(data),
        onReviewsChunk: (data) => {
          // Accumulate chunks — show results progressively
          accumulatedRef.current = [...accumulatedRef.current, ...data.reviews];
          setReviews(accumulatedRef.current);
        },
        onComplete: (data) => {
          // Use complete payload if available, fallback to accumulated chunks
          const reviews = data.reviews.length > 0 ? data.reviews : accumulatedRef.current;
          setReviews(reviews);
          setFetchDone(true);
          setIsFetching(false);
          setFetchProgress(null);
        },
        onError: () => {
          // Connection dropped — show whatever we have so far
          if (accumulatedRef.current.length > 0) {
            setReviews(accumulatedRef.current);
          }
          setFetchDone(true);
          setIsFetching(false);
          setFetchProgress(null);
        },
      });
    },
    [selectedApp, countryCode, setReviews, setFetchDone, setFetchProgress, setIsFetching]
  );

  const cancel = useCallback(() => {
    abortRef.current?.();
    if (accumulatedRef.current.length > 0) {
      setReviews(accumulatedRef.current);
    }
    setFetchDone(true);
    setIsFetching(false);
    setFetchProgress(null);
  }, [setReviews, setFetchDone, setIsFetching, setFetchProgress]);

  return { fetch, cancel };
}
