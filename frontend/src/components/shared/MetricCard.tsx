"use client";

interface MetricCardProps {
  label: string;
  value: string;
  help?: string;
  delta?: string;
  prominent?: boolean;
}

export function MetricCard({ label, value, help, delta, prominent }: MetricCardProps) {
  return (
    <div
      className={`rounded-md p-5 transition-colors ${
        prominent
          ? "bg-text-primary text-white"
          : "bg-bg-tertiary border border-border"
      }`}
      style={{ boxShadow: prominent ? "var(--shadow-md)" : "var(--shadow-sm)" }}
    >
      <div className={`text-sm font-semibold uppercase tracking-[0.08em] mb-1.5 ${
        prominent ? "text-white/60" : "text-text-tertiary"
      }`}>
        {label}
        {help && (
          <span
            className={`inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded-full text-sm font-bold cursor-help align-middle ${
              prominent ? "bg-white/15 text-white/70" : "bg-border-strong/30 text-text-tertiary"
            }`}
            title={help}
          >
            i
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${
        prominent ? "text-white" : "text-text-primary"
      }`}>
        {value}
      </div>
      {delta && (
        <div
          className={`text-sm font-semibold mt-1 ${
            delta.startsWith("+") ? "text-positive" : delta.startsWith("-") ? "text-negative" : prominent ? "text-white/60" : "text-text-secondary"
          }`}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
