import pandas as pd
from app.services.sentiment import extract_keywords, extract_bigrams


def cluster_reviews_by_theme(reviews: list[dict], rating_min: int, rating_max: int, top_n: int = 5) -> list[dict]:
    df = pd.DataFrame(reviews)
    if df.empty:
        return []

    subset = df[df["rating"].between(rating_min, rating_max)].copy()
    if subset.empty:
        return []

    texts = (subset["title"].fillna("") + " " + subset["review"].fillna("")).tolist()
    bigrams = extract_bigrams(texts, top_n=50)
    keywords = extract_keywords(texts, top_n=50)

    bg_dict = {f"{a} {b}": c for (a, b), c in bigrams}

    themes = []
    used_reviews = set()
    top_phrases = list(bg_dict.items())[:top_n * 3]

    for phrase, phrase_count in top_phrases:
        if len(themes) >= top_n:
            break

        phrase_words = phrase.split()
        matching = subset[
            subset.apply(
                lambda r, pw=phrase_words: any(
                    w in (str(r["title"]).lower() + " " + str(r["review"]).lower())
                    for w in pw
                ),
                axis=1,
            )
        ]

        matching = matching[~matching.index.isin(used_reviews)]
        if matching.empty:
            continue

        # Sort by date if date column exists and is valid
        try:
            best = matching.sort_values("date", ascending=False).iloc[0]
        except Exception:
            best = matching.iloc[0]
        used_reviews.add(best.name)

        related_words = []
        review_text = (str(best["title"]) + " " + str(best["review"])).lower()
        for kw, cnt in keywords:
            if kw in review_text and kw not in phrase_words and len(related_words) < 3:
                related_words.append(kw)

        matching_count = len(matching)

        date_val = best.get("date", "")
        if hasattr(date_val, "strftime"):
            example_date = date_val.strftime("%Y-%m-%d")
        else:
            example_date = str(date_val)[:10] if date_val else ""

        themes.append({
            "theme": phrase,
            "mentions": phrase_count,
            "example_title": best["title"],
            "example_review": best["review"],
            "example_rating": int(best["rating"]),
            "example_date": example_date,
            "example_author": best["author"],
            "related_words": related_words,
            "matching_count": matching_count,
        })

    return themes
