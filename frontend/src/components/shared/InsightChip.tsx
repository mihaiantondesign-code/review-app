"use client";

export type ChipState = "neutral" | "included" | "excluded";

interface InsightChipProps {
  label: string;
  count: number;
  state: ChipState;
  onInclude: () => void;
  onExclude: () => void;
  onClear: () => void;
}

export function InsightChip({ label, count, state, onInclude, onExclude, onClear }: InsightChipProps) {
  const handleClick = () => {
    if (state === "neutral") onInclude();
    else if (state === "included") onExclude();
    else onClear();
  };

  const baseClass =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium select-none cursor-pointer transition-all duration-150 active:scale-[0.96]";

  if (state === "neutral") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${baseClass} bg-bg-secondary text-text-secondary hover:bg-[rgba(0,0,0,0.08)] hover:text-text-primary border border-transparent`}
        title="Click to include"
      >
        <span>{label}</span>
        <span className="text-[11px] font-semibold text-text-tertiary tabular-nums">{count}</span>
      </button>
    );
  }

  if (state === "included") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${baseClass} bg-[rgba(34,197,94,0.12)] text-[#16a34a] border border-[rgba(34,197,94,0.25)] hover:bg-[rgba(34,197,94,0.18)]`}
        title="Click to exclude"
      >
        {/* Checkmark */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 6.5l2.5 2.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{label}</span>
        <span className="text-[11px] font-semibold opacity-70 tabular-nums">{count}</span>
      </button>
    );
  }

  // excluded
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClass} bg-[rgba(239,68,68,0.10)] text-[#dc2626] border border-[rgba(239,68,68,0.20)] hover:bg-[rgba(239,68,68,0.16)]`}
      title="Click to clear"
    >
      {/* X icon */}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="line-through opacity-70">{label}</span>
      <span className="text-[11px] font-semibold opacity-60 tabular-nums">{count}</span>
    </button>
  );
}
