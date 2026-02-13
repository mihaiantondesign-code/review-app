from pydantic import BaseModel
from typing import Optional


class Review(BaseModel):
    date: str
    rating: int
    title: str
    review: str
    author: str
    version: str = "N/A"


class AppSearchResult(BaseModel):
    id: str
    name: str
    developer: str
    icon: str
    bundle: str
    price: str
    rating: float
    ratings_count: int


class BusinessInfo(BaseModel):
    name: str
    trustScore: float
    stars: int
    totalReviews: int


class SentimentResult(BaseModel):
    score: float
    label: str
    positive: int
    negative: int
    total_words: int


class AdjustedMetrics(BaseModel):
    original_count: int
    original_avg: float
    adjusted_count: int
    adjusted_avg: float
    excluded_count: int
    excluded_pct: float
    rating_delta: float
    category_breakdown: dict[str, int]


class Theme(BaseModel):
    theme: str
    mentions: int
    example_title: str
    example_review: str
    example_rating: int
    example_date: str
    example_author: str
    related_words: list[str]
    matching_count: int


class SentimentRequest(BaseModel):
    texts: list[str]


class AdjustedMetricsRequest(BaseModel):
    reviews: list[Review]


class ThemesRequest(BaseModel):
    reviews: list[Review]
    rating_min: int = 1
    rating_max: int = 2


class KeywordsRequest(BaseModel):
    texts: list[str]
    top_n: int = 30


class ExcelExportRequest(BaseModel):
    reviews: list[Review]


class ComparisonExcelRequest(BaseModel):
    apps: dict[str, list[Review]]
    app_names: dict[str, str]


class SSEProgress(BaseModel):
    page: int
    total_pages: int
    reviews_so_far: int
    message: str = ""
