"use client";

import { StarRating } from "./StarRating";
import type { AppSearchResult } from "@/types";

interface AppCardProps {
  app: AppSearchResult;
  onClick?: () => void;
  selected?: boolean;
}

export function AppCard({ app, onClick, selected }: AppCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-sm transition-all duration-150 ${
        selected
          ? "bg-accent-light ring-1 ring-accent/20"
          : "hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.07)] active:scale-[0.98]"
      }`}
    >
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
