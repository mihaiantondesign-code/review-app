import requests
from datetime import datetime


def build_url(country: str, app_id: str, page: int = 1) -> str:
    return f"https://itunes.apple.com/{country}/rss/customerreviews/page={page}/id={app_id}/sortBy=mostRecent/json"


def lookup_app_name(app_id: str, country: str = "us") -> str:
    try:
        resp = requests.get(
            f"https://itunes.apple.com/lookup?id={app_id}&country={country}",
            timeout=10,
        )
        data = resp.json()
        results = data.get("results", [])
        if results:
            return results[0].get("trackName", f"App {app_id}")
    except Exception:
        pass
    return f"App {app_id}"


def search_apps(query: str, country: str = "us", limit: int = 10) -> list[dict]:
    try:
        resp = requests.get(
            "https://itunes.apple.com/search",
            params={
                "term": query,
                "entity": "software",
                "country": country,
                "limit": limit,
            },
            timeout=10,
        )
        data = resp.json()
        results = []
        for r in data.get("results", []):
            results.append({
                "id": str(r.get("trackId", "")),
                "name": r.get("trackName", ""),
                "developer": r.get("artistName", ""),
                "icon": r.get("artworkUrl60", ""),
                "bundle": r.get("bundleId", ""),
                "price": r.get("formattedPrice", "Free"),
                "rating": r.get("averageUserRating", 0),
                "ratings_count": r.get("userRatingCount", 0),
            })
        return results
    except Exception:
        return []


def parse_entry(entry: dict) -> dict | None:
    try:
        review_text = entry.get("content", {}).get("label", "")
        title = entry.get("title", {}).get("label", "")
        rating = entry.get("im:rating", {}).get("label", "")
        date_str = entry.get("updated", {}).get("label", "")
        author = entry.get("author", {}).get("name", {}).get("label", "")
        version_info = entry.get("im:version", {})
        version = version_info.get("label", "N/A") if isinstance(version_info, dict) else "N/A"
        review_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")) if date_str else None
        return {
            "date": review_date,
            "rating": int(rating) if rating else None,
            "title": title,
            "review": review_text,
            "author": author,
            "version": version,
        }
    except Exception:
        return None


def fetch_reviews_simple(app_id: str, country: str, max_pages: int, cutoff_date: datetime) -> list[dict]:
    all_reviews = []
    for page in range(1, max_pages + 1):
        url = build_url(country, app_id, page)
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            data = response.json()
        except Exception:
            break

        feed = data.get("feed", {})
        entries = feed.get("entry", [])
        if not entries:
            break

        all_too_old = True
        for entry in entries:
            parsed = parse_entry(entry)
            if parsed and parsed["date"] and parsed["rating"]:
                if parsed["date"] >= cutoff_date:
                    all_reviews.append(parsed)
                    all_too_old = False

        if all_too_old and page > 1:
            break

    return all_reviews


def fetch_reviews_generator(app_id: str, country: str, max_pages: int, cutoff_date: datetime):
    """Generator that yields (event_type, data) tuples for SSE streaming."""
    all_reviews = []

    for page in range(1, max_pages + 1):
        yield ("progress", {
            "page": page,
            "total_pages": max_pages,
            "reviews_so_far": len(all_reviews),
            "message": f"Fetching page {page}/{max_pages}...",
        })

        url = build_url(country, app_id, page)
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            yield ("error", {"message": f"Page {page}: Network error - {e}"})
            break
        except ValueError:
            yield ("error", {"message": f"Page {page}: Invalid JSON response"})
            break

        feed = data.get("feed", {})
        entries = feed.get("entry", [])

        if not entries:
            break

        all_too_old = True
        for entry in entries:
            parsed = parse_entry(entry)
            if parsed and parsed["date"] and parsed["rating"]:
                if parsed["date"] >= cutoff_date:
                    parsed["date"] = parsed["date"].isoformat()
                    all_reviews.append(parsed)
                    all_too_old = False

        if all_too_old and page > 1:
            break

    yield ("complete", {
        "reviews": all_reviews,
        "total": len(all_reviews),
    })
