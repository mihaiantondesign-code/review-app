"""
LLM-based problem category classifier using Anthropic claude-haiku.
Uses httpx (already in deps) to call the Anthropic Messages API directly.
"""
import os
import json
import httpx

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

VALID_CATEGORIES = {"TECHNICAL", "DESIGN", "CUSTOMER_EXPERIENCE", "PRICING", "PERFORMANCE"}

SYSTEM_PROMPT = """You are classifying app store reviews into problem categories.

Categories and their definitions:
- TECHNICAL: crashes, bugs, errors, broken features, login failures, sync issues, blank screens
- DESIGN: confusing navigation, hard to find features, poor layout, unintuitive flows, visual bugs, accessibility
- CUSTOMER_EXPERIENCE: poor support, refund issues, account problems, missing expected features, confusing onboarding
- PRICING: cost complaints, unexpected charges, paywalled features, free tier limitations, subscription issues
- PERFORMANCE: slow loading, lag, freezing, battery drain, high data usage

Rules:
- A review can match multiple categories
- If the review is positive or describes no problem, return []
- Return ONLY a JSON array of matching category strings, nothing else

Examples:
"The app crashes every time I try to log in" → ["TECHNICAL"]
"Way too expensive and keeps crashing" → ["TECHNICAL", "PRICING"]
"Love the app!" → []
"Support never responded to my ticket and the checkout flow is confusing" → ["CUSTOMER_EXPERIENCE", "DESIGN"]"""


def classify_single(review_text: str) -> list[str]:
    """Classify a single review text. Returns list of matching category strings."""
    if not ANTHROPIC_API_KEY:
        return []

    prompt = f'Review to classify: "{review_text}"'

    try:
        resp = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5",
                "max_tokens": 100,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data["content"][0]["text"].strip()
        categories = json.loads(raw)
        if not isinstance(categories, list):
            return []
        return [c for c in categories if c in VALID_CATEGORIES]
    except Exception:
        return []


def classify_batch(review_texts: list[str]) -> list[list[str]]:
    """Classify a batch of review texts. Returns one result list per input text."""
    return [classify_single(text) for text in review_texts]
