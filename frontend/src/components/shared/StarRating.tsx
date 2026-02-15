"use client";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, size = "md" }: StarRatingProps) {
  const full = Math.round(rating);
  const sizeClass = {
    sm: "text-[10px] tracking-[1px]",
    md: "text-sm tracking-wider",
    lg: "text-xl tracking-wider",
  }[size];

  return (
    <span className={`${sizeClass} text-star select-none`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(full)}
      <span className="opacity-25">{"★".repeat(5 - full)}</span>
    </span>
  );
}
