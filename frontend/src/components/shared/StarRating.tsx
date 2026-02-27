"use client";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  /** When true, uses sentiment color (green/amber/red). Default: false (grey). */
  colored?: boolean;
}

export function StarRating({ rating, size = "md", colored = false }: StarRatingProps) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size];

  const display = Number.isInteger(rating) ? String(rating) : rating.toFixed(1);

  const colorClass = colored
    ? rating >= 4
      ? "text-[#34C759]"
      : rating <= 2
      ? "text-[#FF3B30]"
      : "text-[#FF9500]"
    : "text-text-tertiary";

  return (
    <span
      className={`${sizeClass} ${colorClass} select-none tabular-nums font-semibold`}
      aria-label={`${rating} out of 5 stars`}
    >
      {display} ★
    </span>
  );
}
