"use client";

import { useState } from "react";

function countryFlag(code: string): string {
  const upper = code.toUpperCase().slice(0, 2);
  if (upper.length < 2 || !/^[A-Z]{2}$/.test(upper)) return "";
  return String.fromCodePoint(
    0x1f1e6 + upper.charCodeAt(0) - 65,
    0x1f1e6 + upper.charCodeAt(1) - 65
  );
}

interface CountryFieldProps {
  value: string;
  onChange: (v: string) => void;
  /** Size variant — "sm" for sidebar, "lg" for mobile landing */
  size?: "sm" | "lg";
}

export function CountryField({ value, onChange, size = "sm" }: CountryFieldProps) {
  const [editing, setEditing] = useState(!value);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    const trimmed = draft.trim().toLowerCase();
    onChange(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  const inputClass =
    size === "lg"
      ? "flex-1 px-4 py-3.5 min-h-[44px] text-base border border-border-strong rounded-xl bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
      : "flex-1 px-3 py-2 min-h-[44px] text-sm border border-border-strong rounded-xl bg-bg-primary focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all";

  const editBtnClass =
    size === "lg"
      ? "flex items-center gap-1 text-sm font-medium text-[#0051B3] shrink-0"
      : "flex items-center gap-1 text-sm font-medium text-[#0051B3] shrink-0";

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. it, us"
          className={inputClass}
        />
        <button onClick={handleSave} className={editBtnClass}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          Save
        </button>
      </div>
    );
  }

  const flag = countryFlag(value);
  const label = value ? `${value.toUpperCase()}${flag ? " " + flag : ""}` : "—";

  return (
    <div className="flex items-center gap-2.5 min-h-[44px]">
      <span className={size === "lg" ? "text-base font-medium text-text-primary" : "text-sm font-medium text-text-primary"}>
        {label}
      </span>
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className={editBtnClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
        Edit
      </button>
    </div>
  );
}
