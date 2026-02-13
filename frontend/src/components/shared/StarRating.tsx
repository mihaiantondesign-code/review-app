"use client";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, size = "md" }: StarRatingProps) {
  const full = Math.round(rating);
  const sizeClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
  }[size];

  return (
    <span className={`${sizeClass} tracking-wider`} style={{ color: "#FFB800" }}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}
