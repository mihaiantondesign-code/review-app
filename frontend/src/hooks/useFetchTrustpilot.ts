"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getTrustpilotSSEUrl } from "@/lib/api";
import { consumeSSE } from "@/lib/sse";

export function useFetchTrustpilot() {
  const abortRef = useRef<(() => void) | null>(null);
  const {
    setTrustpilotReviews,
    setTrustpilotInfo,
    setTpFetchDone,
    setTpFetchProgress,
    setIsTpFetching,
  } = useAppStore();

  const fetch = useCallback(
    (domain: string, maxPages: number, cutoffDays: number) => {
      abortRef.current?.();

      setIsTpFetching(true);
      setTpFetchDone(false);
      setTrustpilotReviews([]);
      setTrustpilotInfo(null);

      const url = getTrustpilotSSEUrl(domain, maxPages, cutoffDays);

      abortRef.current = consumeSSE(url, {
        onProgress: (data) => setTpFetchProgress(data),
        onBusinessInfo: (data) => setTrustpilotInfo(data),
        onComplete: (data) => {
          setTrustpilotReviews(data.reviews);
          if (data.business_info) setTrustpilotInfo(data.business_info);
          setTpFetchDone(true);
          setIsTpFetching(false);
          setTpFetchProgress(null);
        },
        onError: () => {
          setTpFetchDone(true);
          setIsTpFetching(false);
          setTpFetchProgress(null);
        },
      });
    },
    [setTrustpilotReviews, setTrustpilotInfo, setTpFetchDone, setTpFetchProgress, setIsTpFetching]
  );

  const cancel = useCallback(() => {
    abortRef.current?.();
    setIsTpFetching(false);
    setTpFetchProgress(null);
  }, [setIsTpFetching, setTpFetchProgress]);

  return { fetch, cancel };
}
