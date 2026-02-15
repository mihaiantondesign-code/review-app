"use client";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  tone?: "neutral" | "action" | "success";
}

export function EmptyState({ icon, title, description, tone = "neutral" }: EmptyStateProps) {
  const bgClass = {
    neutral: "bg-bg-secondary",
    action: "bg-accent-light",
    success: "bg-positive/5",
  }[tone];

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${bgClass} rounded-lg my-6`}>
      <div className="text-5xl mb-4 opacity-70">
        {icon}
      </div>
      <div className="text-lg font-semibold text-text-primary mb-1.5 tracking-tight">
        {title}
      </div>
      <div className="text-[14px] text-text-secondary max-w-[340px] leading-relaxed">
        {description}
      </div>
    </div>
  );
}
