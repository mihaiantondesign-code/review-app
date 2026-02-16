"use client";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, size = "md" }: StarRatingProps) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size];

  const display = Number.isInteger(rating) ? String(rating) : rating.toFixed(1);

  return (
    <span className={`${sizeClass} text-text-tertiary select-none tabular-nums`} aria-label={`${rating} out of 5 stars`}>
      {display} ★
    </span>
  );
}
