const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  return fetchJSON<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function startAppStoreJob(appId: string, country: string, maxPages: number, cutoffDays: number) {
  return postJSON<{ job_id: string }>("/api/jobs/appstore/start", {
    app_id: appId, country, max_pages: maxPages, cutoff_days: cutoffDays,
  });
}

export async function startTrustpilotJob(domain: string, maxPages: number, cutoffDays: number) {
  return postJSON<{ job_id: string }>("/api/jobs/trustpilot/start", {
    domain, max_pages: maxPages, cutoff_days: cutoffDays,
  });
}

export async function getJobStatus(jobId: string) {
  return fetchJSON<{ status: string; total: number; error?: string }>(`/api/jobs/status/${jobId}`);
}

export async function getJobResult(jobId: string) {
  return fetchJSON<{
    reviews: { date: string; rating: number; title: string; review: string; author: string; version: string }[];
    total: number;
    business_info?: { name: string; trustScore: number; stars: number; totalReviews: number } | null;
  }>(`/api/jobs/result/${jobId}`);
}

export async function searchApps(query: string, country: string) {
  return fetchJSON<
    {
      id: string;
      name: string;
      developer: string;
      icon: string;
      bundle: string;
      price: string;
      rating: number;
      ratings_count: number;
    }[]
  >(`/api/apps/search?query=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}`);
}

export async function searchTrustpilot(query: string) {
  return fetchJSON<{ name: string; domain: string; logo: string; stars: number; reviews: number }[]>(
    `/api/apps/trustpilot/search?query=${encodeURIComponent(query)}`
  );
}

export async function lookupApp(appId: string, country: string) {
  return fetchJSON<{ id: string; name: string }>(
    `/api/apps/${appId}?country=${encodeURIComponent(country)}`
  );
}

export function getAppStoreSSEUrl(
  appId: string,
  country: string,
  maxPages: number,
  cutoffDays: number
) {
  return `${API_URL}/api/reviews/appstore/stream?app_id=${appId}&country=${country}&max_pages=${maxPages}&cutoff_days=${cutoffDays}`;
}

export function getTrustpilotSSEUrl(
  domain: string,
  maxPages: number,
  cutoffDays: number
) {
  return `${API_URL}/api/reviews/trustpilot/stream?domain=${encodeURIComponent(domain)}&max_pages=${maxPages}&cutoff_days=${cutoffDays}`;
}

export async function analyzeSentiment(texts: string[]) {
  return postJSON<{
    score: number;
    label: string;
    positive: number;
    negative: number;
    total_words: number;
  }>("/api/analysis/sentiment", { texts });
}

export async function analyzeAdjustedMetrics(
  reviews: { date: string; rating: number; title: string; review: string; author: string; version: string }[]
) {
  return postJSON<{
    original_count: number;
    original_avg: number;
    adjusted_count: number;
    adjusted_avg: number;
    excluded_count: number;
    excluded_pct: number;
    rating_delta: number;
    category_breakdown: Record<string, number>;
  }>("/api/analysis/adjusted-metrics", { reviews });
}

export async function analyzeThemes(
  reviews: { date: string; rating: number; title: string; review: string; author: string; version: string }[],
  ratingMin: number,
  ratingMax: number
) {
  return postJSON<
    {
      theme: string;
      mentions: number;
      example_title: string;
      example_review: string;
      example_rating: number;
      example_date: string;
      example_author: string;
      related_words: string[];
      matching_count: number;
    }[]
  >("/api/analysis/themes", { reviews, rating_min: ratingMin, rating_max: ratingMax });
}

export async function analyzeKeywords(texts: string[], topN: number = 30) {
  return postJSON<{ word: string; count: number }[]>("/api/analysis/keywords", {
    texts,
    top_n: topN,
  });
}

export async function exportExcel(
  reviews: { date: string; rating: number; title: string; review: string; author: string; version: string }[]
) {
  const res = await fetch(`${API_URL}/api/export/excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviews }),
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export async function classifyProblems(texts: string[]): Promise<{ categories: string[] }[]> {
  return postJSON<{ categories: string[] }[]>("/api/analysis/classify-problems", { texts });
}

export async function exportComparisonExcel(
  apps: Record<string, { date: string; rating: number; title: string; review: string; author: string; version: string }[]>,
  appNames: Record<string, string>
) {
  const res = await fetch(`${API_URL}/api/export/comparison-excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apps, app_names: appNames }),
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}
