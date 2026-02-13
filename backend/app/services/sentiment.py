import re
from collections import Counter
from app.config import POSITIVE_WORDS, NEGATIVE_WORDS, STOP_WORDS


def compute_sentiment(texts: list[str]) -> dict:
    pos_count = 0
    neg_count = 0
    total_words = 0
    for text in texts:
        words = re.findall(r"[a-zA-ZàèéìòùÀÈÉÌÒÙ]{3,}", text.lower())
        total_words += len(words)
        for w in words:
            if w in POSITIVE_WORDS:
                pos_count += 1
            elif w in NEGATIVE_WORDS:
                neg_count += 1

    sentiment_total = pos_count + neg_count
    if sentiment_total == 0:
        return {"score": 0.0, "label": "Neutral", "positive": 0, "negative": 0, "total_words": total_words}

    score = (pos_count - neg_count) / sentiment_total
    if score > 0.2:
        label = "Positive"
    elif score < -0.2:
        label = "Negative"
    else:
        label = "Mixed"

    return {
        "score": round(score, 2),
        "label": label,
        "positive": pos_count,
        "negative": neg_count,
        "total_words": total_words,
    }


def extract_keywords(texts: list[str], top_n: int = 30) -> list[tuple[str, int]]:
    word_counts: Counter = Counter()
    for text in texts:
        words = re.findall(r"[a-zA-ZàèéìòùÀÈÉÌÒÙ]{3,}", text.lower())
        for w in words:
            if w not in STOP_WORDS:
                word_counts[w] += 1
    return word_counts.most_common(top_n)


def extract_bigrams(texts: list[str], top_n: int = 20) -> list[tuple[tuple[str, str], int]]:
    bigram_counts: Counter = Counter()
    for text in texts:
        words = re.findall(r"[a-zA-ZàèéìòùÀÈÉÌÒÙ]{3,}", text.lower())
        words = [w for w in words if w not in STOP_WORDS]
        for i in range(len(words) - 1):
            bigram_counts[(words[i], words[i + 1])] += 1
    return bigram_counts.most_common(top_n)
