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
      className={`flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-sm transition-colors ${
        selected
          ? "bg-[rgba(0,0,0,0.06)]"
          : "hover:bg-[rgba(0,0,0,0.04)]"
      }`}
    >
      {app.icon && (
        <img
          src={app.icon}
          alt=""
          className="w-7 h-7 rounded-[7px] shrink-0"
        />
      )}
      <div className="overflow-hidden flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-text-primary truncate">
          {app.name}
        </div>
        <StarRating rating={app.rating} size="sm" />
      </div>
    </button>
  );
}
