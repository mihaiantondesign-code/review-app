import urllib.request
import json
import ssl
from fastapi import APIRouter, Query
from app.services.appstore import search_apps, lookup_app_name

router = APIRouter(prefix="/api/apps", tags=["apps"])


@router.get("/search")
def search(query: str = Query(...), country: str = Query("us"), limit: int = Query(10)):
    results = search_apps(query, country=country, limit=limit)
    return results


@router.get("/trustpilot/search")
def search_trustpilot(query: str = Query(...), limit: int = Query(8)):
    """Search Trustpilot autocomplete for company names."""
    url = f"https://www.trustpilot.com/api/v1/autocomplete/search?query={urllib.parse.quote(query)}&language=en"
    try:
        import urllib.parse
        url = f"https://www.trustpilot.com/api/v1/autocomplete/search?query={urllib.parse.quote(query)}&language=en"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
        )
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=8, context=ctx) as resp:
            data = json.loads(resp.read())
        businesses = data.get("businesses", []) or []
        results = []
        for b in businesses[:limit]:
            results.append({
                "name": b.get("displayName", ""),
                "domain": b.get("identificator", {}).get("websiteUrl", ""),
                "logo": b.get("logo", ""),
                "stars": b.get("stars", 0),
                "reviews": b.get("numberOfReviews", {}).get("total", 0),
            })
        return results
    except Exception:
        return []


@router.get("/{app_id}")
def get_app(app_id: str, country: str = Query("us")):
    name = lookup_app_name(app_id, country)
    return {"id": app_id, "name": name}
