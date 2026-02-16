"use client";

import type { ProblemCategory } from "@/types";

export const CATEGORY_CONFIG: Record<
  ProblemCategory,
  { label: string; shortLabel: string; color: string; bg: string; border: string }
> = {
  TECHNICAL: {
    label: "Technical",
    shortLabel: "Technical",
    color: "#dc2626",
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.22)",
  },
  DESIGN: {
    label: "Design",
    shortLabel: "Design",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.10)",
    border: "rgba(124,58,237,0.22)",
  },
  CUSTOMER_EXPERIENCE: {
    label: "CX",
    shortLabel: "CX",
    color: "#d97706",
    bg: "rgba(217,119,6,0.10)",
    border: "rgba(217,119,6,0.22)",
  },
  PRICING: {
    label: "Pricing",
    shortLabel: "Pricing",
    color: "#ca8a04",
    bg: "rgba(202,138,4,0.10)",
    border: "rgba(202,138,4,0.22)",
  },
  PERFORMANCE: {
    label: "Performance",
    shortLabel: "Perf",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.10)",
    border: "rgba(37,99,235,0.22)",
  },
};

interface ProblemChipProps {
  category: ProblemCategory;
  size?: "xs" | "sm";
  onClick?: () => void;
}

export function ProblemChip({ category, size = "sm", onClick }: ProblemChipProps) {
  const cfg = CATEGORY_CONFIG[category];

  const cls =
    size === "xs"
      ? "px-2 py-0.5 text-[11px] font-semibold rounded-full"
      : "px-2.5 py-1 text-xs font-semibold rounded-full";

  const inner = (
    <span
      className={`inline-flex items-center ${cls} border cursor-default`}
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {size === "xs" ? cfg.shortLabel : cfg.label}
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="focus:outline-none">
        {inner}
      </button>
    );
  }
  return inner;
}
