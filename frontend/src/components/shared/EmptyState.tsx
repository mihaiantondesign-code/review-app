"use client";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-bg-secondary rounded-lg my-6">
      <div className="text-6xl mb-5" style={{ filter: "grayscale(30%)" }}>
        {icon}
      </div>
      <div className="text-xl font-semibold text-text-primary mb-2 tracking-tight">
        {title}
      </div>
      <div className="text-[15px] text-text-secondary max-w-[360px] leading-relaxed">
        {description}
      </div>
    </div>
  );
}
