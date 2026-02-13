import re
import json
import urllib.request
import ssl
from datetime import datetime


def clean_domain(raw_input: str) -> str:
    d = raw_input.strip().rstrip("/")
    for prefix in [
        "https://it.trustpilot.com/review/",
        "https://www.trustpilot.com/review/",
        "http://it.trustpilot.com/review/",
        "http://www.trustpilot.com/review/",
        "it.trustpilot.com/review/",
        "www.trustpilot.com/review/",
        "trustpilot.com/review/",
        "https://", "http://", "www.",
    ]:
        if d.lower().startswith(prefix):
            d = d[len(prefix):]
            break
    d = d.split("?")[0].split("#")[0].strip("/")
    return d


def fetch_page(domain: str, page: int) -> tuple[int, str]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "it-IT,it;q=0.9",
    }
    ctx = ssl.create_default_context()

    for host in ["it.trustpilot.com", "www.trustpilot.com"]:
        url = f"https://{host}/review/{domain}?page={page}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                raw = resp.read()
                html = raw.decode("utf-8", errors="replace")
                return resp.status, html
        except urllib.request.HTTPError as e:
            if e.code == 404 and host == "it.trustpilot.com":
                continue
            raise

    raise Exception(f"Domain '{domain}' not found on Trustpilot (404 on both it. and www. subdomains)")


def fetch_reviews_generator(domain: str, max_pages: int, cutoff_date: datetime):
    """Generator that yields (event_type, data) tuples for SSE streaming."""
    all_reviews = []
    business_info = None

    for page in range(1, max_pages + 1):
        yield ("progress", {
            "page": page,
            "total_pages": max_pages,
            "reviews_so_far": len(all_reviews),
            "message": f"Trustpilot page {page}/{max_pages}...",
        })

        try:
            status_code, html = fetch_page(domain, page)

            if status_code != 200:
                yield ("error", {"message": f"Trustpilot page {page}: HTTP {status_code}"})
                break

            if len(html) < 1000:
                yield ("error", {"message": f"Trustpilot page {page}: Response too short ({len(html)} bytes)"})
                break

            match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
            if not match:
                yield ("error", {"message": f"Trustpilot page {page}: Could not find review data in page"})
                break

            nd = json.loads(match.group(1))
            props = nd.get("props", {}).get("pageProps", {})

            if page == 1:
                bu = props.get("businessUnit", {})
                business_info = {
                    "name": bu.get("displayName", domain),
                    "trustScore": bu.get("trustScore", 0),
                    "stars": bu.get("stars", 0),
                    "totalReviews": bu.get("numberOfReviews", 0),
                }
                pagination = props.get("filters", {}).get("pagination", {})
                total_pages = pagination.get("totalPages", 1)
                if max_pages > total_pages:
                    max_pages = total_pages

                yield ("business_info", business_info)

            reviews = props.get("reviews", [])
            if not reviews:
                break

            all_too_old = True
            for r in reviews:
                try:
                    dates = r.get("dates", {})
                    pub_date_str = dates.get("publishedDate", "")
                    if pub_date_str:
                        pub_date = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                    else:
                        continue

                    if pub_date < cutoff_date:
                        continue

                    all_too_old = False
                    all_reviews.append({
                        "date": pub_date.isoformat(),
                        "rating": r.get("rating", 0),
                        "title": r.get("title", ""),
                        "review": r.get("text", ""),
                        "author": r.get("consumer", {}).get("displayName", ""),
                        "version": "N/A",
                    })
                except Exception:
                    continue

            if all_too_old and page > 1:
                break

        except Exception as e:
            yield ("error", {"message": f"Trustpilot page {page}: {type(e).__name__}: {e}"})
            break

    yield ("complete", {
        "reviews": all_reviews,
        "total": len(all_reviews),
        "business_info": business_info,
    })
