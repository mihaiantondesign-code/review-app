import re
import pandas as pd
from app.config import NON_APP_CATEGORIES, APP_RELATED_KEYWORDS, CATEGORY_LABELS


def classify_review(title: str, review_text: str) -> tuple[str, str | None]:
    text = f"{title} {review_text}".lower()
    words = set(re.findall(r"[a-zA-ZàèéìòùÀÈÉÌÒÙ'-]{3,}", text))

    non_app_scores = {}
    total_non_app = 0
    for category, kw_set in NON_APP_CATEGORIES.items():
        hits = words & kw_set
        for phrase in kw_set:
            if " " in phrase and phrase in text:
                hits.add(phrase)
        score = len(hits)
        non_app_scores[category] = score
        total_non_app += score

    app_hits = words & APP_RELATED_KEYWORDS
    for phrase in APP_RELATED_KEYWORDS:
        if " " in phrase and phrase in text:
            app_hits.add(phrase)
    app_score = len(app_hits)

    if total_non_app == 0 and app_score == 0:
        return "app_related", None
    if total_non_app == 0:
        return "app_related", None

    if app_score == 0 and total_non_app > 0:
        dominant = max(non_app_scores, key=non_app_scores.get)
        return "non_app", dominant

    if total_non_app > app_score * 1.5:
        dominant = max(non_app_scores, key=non_app_scores.get)
        return "non_app", dominant

    return "app_related", None


def add_classification_columns(df: pd.DataFrame) -> pd.DataFrame:
    classifications = df.apply(
        lambda r: classify_review(str(r.get("title", "")), str(r.get("review", ""))),
        axis=1,
    )
    df["is_app_related"] = classifications.apply(lambda x: x[0] == "app_related")
    df["exclusion_category"] = classifications.apply(lambda x: x[1])
    return df


def compute_adjusted_metrics(reviews: list[dict]) -> dict:
    if not reviews:
        return {}

    df = pd.DataFrame(reviews)
    if df.empty:
        return {}

    df = add_classification_columns(df)

    total = len(df)
    original_avg = df["rating"].mean()

    app_df = df[df["is_app_related"]].copy()
    excluded_df = df[~df["is_app_related"]].copy()

    app_count = len(app_df)
    excluded_count = len(excluded_df)
    adjusted_avg = app_df["rating"].mean() if not app_df.empty else 0

    category_breakdown = {}
    if not excluded_df.empty:
        for cat in NON_APP_CATEGORIES:
            cat_count = len(excluded_df[excluded_df["exclusion_category"] == cat])
            if cat_count > 0:
                category_breakdown[cat] = cat_count

    return {
        "original_count": total,
        "original_avg": round(original_avg, 2),
        "adjusted_count": app_count,
        "adjusted_avg": round(adjusted_avg, 2),
        "excluded_count": excluded_count,
        "excluded_pct": round(excluded_count / total * 100, 1) if total > 0 else 0,
        "rating_delta": round(adjusted_avg - original_avg, 2) if app_count > 0 else 0,
        "category_breakdown": category_breakdown,
    }
