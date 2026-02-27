from fastapi import APIRouter
from pydantic import BaseModel
from app.models.schemas import (
    SentimentRequest,
    AdjustedMetricsRequest,
    ThemesRequest,
    KeywordsRequest,
)
from app.services.sentiment import compute_sentiment, extract_keywords
from app.services.classification import compute_adjusted_metrics
from app.services.themes import cluster_reviews_by_theme
from app.services.problem_classifier import classify_batch_async

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


class ClassifyProblemsRequest(BaseModel):
    texts: list[str]


@router.post("/sentiment")
def sentiment(req: SentimentRequest):
    return compute_sentiment(req.texts)


@router.post("/adjusted-metrics")
def adjusted_metrics(req: AdjustedMetricsRequest):
    reviews = [r.model_dump() for r in req.reviews]
    return compute_adjusted_metrics(reviews)


@router.post("/themes")
def themes(req: ThemesRequest):
    reviews = [r.model_dump() for r in req.reviews]
    return cluster_reviews_by_theme(reviews, req.rating_min, req.rating_max)


@router.post("/keywords")
def keywords(req: KeywordsRequest):
    result = extract_keywords(req.texts, req.top_n)
    return [{"word": w, "count": c} for w, c in result]


@router.post("/classify-problems")
async def classify_problems(req: ClassifyProblemsRequest):
    """
    Classify review texts into problem categories using DeepSeek.
    All batches run concurrently — total time ≈ one batch regardless of volume.
    Requires DEEPSEEK_API_KEY env var; returns empty arrays if not set.
    """
    results = await classify_batch_async(req.texts)
    return [{"categories": cats} for cats in results]
