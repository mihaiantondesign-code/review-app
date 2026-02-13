"use client";

interface MetricCardProps {
  label: string;
  value: string;
  help?: string;
  delta?: string;
}

export function MetricCard({ label, value, help, delta }: MetricCardProps) {
  return (
    <div
      className="bg-bg-tertiary border border-border rounded-md p-5"
      style={{ boxShadow: "var(--shadow-sm)" }}
      title={help}
    >
      <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold text-text-primary tracking-tight">
        {value}
      </div>
      {delta && (
        <div
          className={`text-sm font-medium mt-1 ${
            delta.startsWith("+") ? "text-green-600" : delta.startsWith("-") ? "text-red-500" : "text-text-secondary"
          }`}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
