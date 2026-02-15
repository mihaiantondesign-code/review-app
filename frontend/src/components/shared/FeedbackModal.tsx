"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

const STORAGE_KEY = "feedback_shown";
const MAX_SHOWS = 2;
const MIN_HOURS_BETWEEN = 24;
const ACTIVE_TIME_TRIGGER_MS = 3 * 60 * 1000; // 3 minutes
const POST_FETCH_DELAY_MS = 30 * 1000; // 30s after first fetch

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (show) {
      setComment("");
      setStatus("idle");
    }
  }, [show]);

  if (!show) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setStatus("sending");
    try {
      await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      setStatus("done");
      setTimeout(onClose, 1600);
    } catch {
      setStatus("error");
    }
  };

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

        {status === "done" ? (
          <div className="text-center py-4">
            <h2 className="text-[18px] font-semibold text-text-primary">
              Thanks! We'll get to work.
            </h2>
          </div>
        ) : (
          <>
            <h2 className="text-[18px] font-semibold text-text-primary mb-5">
              What features would you like to see?
            </h2>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Type your idea here..."
              rows={4}
              className="w-full text-[13px] text-text-primary border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF2D78]/30 focus:border-[#FF2D78] transition-colors mb-4"
            />

            {status === "error" && (
              <p className="text-xs text-red-500 mb-3">
                Something went wrong. Please try again.
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!comment.trim() || status === "sending"}
              className="w-full py-2.5 text-sm font-semibold text-white text-center rounded-pill transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#FF2D78" }}
            >
              {status === "sending" ? "Sending…" : "Send"}
            </button>

            <button
              onClick={onClose}
              className="block w-full mt-2 py-2 text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              Maybe later
            </button>
          </>
        )}
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
