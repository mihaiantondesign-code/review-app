export interface Review {
  date: string;
  rating: number;
  title: string;
  review: string;
  author: string;
  version: string;
}

export interface AppSearchResult {
  id: string;
  name: string;
  developer: string;
  icon: string;
  bundle: string;
  price: string;
  rating: number;
  ratings_count: number;
}

export interface BusinessInfo {
  name: string;
  trustScore: number;
  stars: number;
  totalReviews: number;
}

export interface SentimentResult {
  score: number;
  label: string;
  positive: number;
  negative: number;
  total_words: number;
}

export interface AdjustedMetrics {
  original_count: number;
  original_avg: number;
  adjusted_count: number;
  adjusted_avg: number;
  excluded_count: number;
  excluded_pct: number;
  rating_delta: number;
  category_breakdown: Record<string, number>;
}

export interface Theme {
  theme: string;
  mentions: number;
  example_title: string;
  example_review: string;
  example_rating: number;
  example_date: string;
  example_author: string;
  related_words: string[];
  matching_count: number;
}

export interface Keyword {
  word: string;
  count: number;
}

export interface FetchProgress {
  page: number;
  total_pages: number;
  reviews_so_far: number;
  message: string;
}

export type ActiveSection = "appstore" | "trustpilot" | "comparison" | "insights" | "backlog";

export type ProblemCategory =
  | "BUGS_TECNICI"
  | "ONBOARDING_SETUP"
  | "UX_USABILITA"
  | "FEATURES_FUNZIONALITA"
  | "CUSTOMER_SUPPORT";

export type ClassificationStatus = "pending" | "classified" | "failed" | "unclassified";

/** Review enriched with problem categories (client-side only, not persisted) */
export interface ClassifiedReview extends Review {
  problem_categories: ProblemCategory[];
  classification_status: ClassificationStatus;
}

export interface BacklogCategoryItem {
  category: ProblemCategory;
  count: number;
  percentage: number;
  sentiment: { positive: number; neutral: number; negative: number };
  top_topics: string[];
}

export interface BacklogQuery {
  include_categories: ProblemCategory[];
  exclude_categories: ProblemCategory[];
}

export type InsightDimension = "topics" | "custom_topics" | "tags";

export type MatchMode = "ANY" | "ALL";

export interface InsightQuery {
  include: Record<InsightDimension, string[]>;
  exclude: Record<InsightDimension, string[]>;
  match_mode: MatchMode;
}

export type FetchMode = "time" | "pages";
