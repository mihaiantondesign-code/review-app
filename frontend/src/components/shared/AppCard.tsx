"use client";

import { StarRating } from "./StarRating";
import type { AppSearchResult } from "@/types";

interface AppCardProps {
  app: AppSearchResult;
  onClick?: () => void;
  selected?: boolean;
  showCheckbox?: boolean;
  checked?: boolean;
}

export function AppCard({ app, onClick, selected, showCheckbox, checked }: AppCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-sm transition-all duration-150 ${
        selected && !showCheckbox
          ? "bg-accent-light ring-1 ring-accent/20"
          : "hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.07)] active:scale-[0.98]"
      }`}
    >
      {showCheckbox && (
        <span
          className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            checked
              ? "bg-[#FF2D78] border-[#FF2D78]"
              : "border-gray-300 bg-white"
          }`}
        >
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      )}
      {app.icon && (
        <img
          src={app.icon}
          alt=""
          className="w-7 h-7 rounded-sm shrink-0"
        />
      )}
      <div className="overflow-hidden flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-text-primary truncate leading-tight">
          {app.name}
        </div>
        <StarRating rating={app.rating} size="sm" />
      </div>
    </button>
  );
}
