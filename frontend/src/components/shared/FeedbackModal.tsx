"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

const TALLY_URL = "https://tally.so/r/vGyoMA";
const STORAGE_KEY = "feedback_shown";
const MAX_SHOWS = 2;
const MIN_HOURS_BETWEEN = 24;
const ACTIVE_TIME_TRIGGER_MS = 3 * 60 * 1000; // 3 minutes
const POST_FETCH_DELAY_MS = 30 * 1000; // 30s after first fetch

function getShownData(): { count: number; lastShown: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, lastShown: 0 };
}

function recordShown() {
  const data = getShownData();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count: data.count + 1, lastShown: Date.now() })
  );
}

function canShow(): boolean {
  const { count, lastShown } = getShownData();
  if (count >= MAX_SHOWS) return false;
  if (lastShown && Date.now() - lastShown < MIN_HOURS_BETWEEN * 60 * 60 * 1000) return false;
  return true;
}

interface FeedbackModalProps {
  show: boolean;
  onClose: () => void;
}

export function FeedbackModal({ show, onClose }: FeedbackModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors text-lg leading-none"
        >
          ✕
        </button>
        <div className="text-3xl mb-3">👋</div>
        <h2 className="text-[18px] font-semibold text-text-primary mb-2">
          Quick feedback?
        </h2>
        <p className="text-[13px] text-text-secondary mb-6 leading-relaxed">
          This is an early version. Your input shapes what gets built next — takes 30 seconds.
        </p>
        <a
          href={TALLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="block w-full py-2.5 text-sm font-semibold text-white text-center rounded-pill transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: "#FF2D78" }}
        >
          Share feedback
        </a>
        <button
          onClick={onClose}
          className="block w-full mt-2 py-2 text-xs text-text-tertiary hover:text-text-primary transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

export function useFeedbackTrigger(
  showModal: () => void,
  hasFired: React.MutableRefObject<boolean>
) {
  const { fetchDone, reviews } = useAppStore();
  const activeTimeRef = useRef(0);
  const activeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const postFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFetchDone = useRef(false);

  const tryShow = useCallback(() => {
    if (hasFired.current) return;
    if (!canShow()) return;
    hasFired.current = true;
    recordShown();
    showModal();
  }, [showModal, hasFired]);

  // Trigger 1: 30s after first successful fetch
  useEffect(() => {
    if (fetchDone && reviews.length > 0 && !prevFetchDone.current) {
      prevFetchDone.current = true;
      postFetchTimerRef.current = setTimeout(tryShow, POST_FETCH_DELAY_MS);
    }
    return () => {
      if (postFetchTimerRef.current) clearTimeout(postFetchTimerRef.current);
    };
  }, [fetchDone, reviews.length, tryShow]);

  // Trigger 2: 3 minutes of active time (increments every second tab is visible)
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        activeTimeRef.current += 1000;
        if (activeTimeRef.current >= ACTIVE_TIME_TRIGGER_MS) {
          if (activeTimerRef.current) clearInterval(activeTimerRef.current);
          tryShow();
        }
      }
    };
    activeTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (activeTimerRef.current) clearInterval(activeTimerRef.current);
    };
  }, [tryShow]);
}
