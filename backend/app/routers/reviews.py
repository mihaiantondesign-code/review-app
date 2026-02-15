import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from app.services.appstore import fetch_reviews_generator
from app.services.trustpilot import clean_domain, fetch_reviews_generator as tp_fetch_reviews_generator

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def sse_format(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.get("/appstore/stream")
def stream_appstore_reviews(
    app_id: str = Query(...),
    country: str = Query("it"),
    max_pages: int = Query(10),
    cutoff_days: int = Query(365),
):
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=cutoff_days)

    def generate():
        for event_type, data in fetch_reviews_generator(app_id, country, max_pages, cutoff_date):
            yield sse_format(event_type, data)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/trustpilot/stream")
def stream_trustpilot_reviews(
    domain: str = Query(...),
    max_pages: int = Query(10),
    cutoff_days: int = Query(365),
):
    domain_clean = clean_domain(domain)
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=cutoff_days)

    def generate():
        for event_type, data in tp_fetch_reviews_generator(domain_clean, max_pages, cutoff_date):
            yield sse_format(event_type, data)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
        },
    )
