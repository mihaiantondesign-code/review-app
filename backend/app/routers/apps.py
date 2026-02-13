from fastapi import APIRouter, Query
from app.services.appstore import search_apps, lookup_app_name

router = APIRouter(prefix="/api/apps", tags=["apps"])


@router.get("/search")
def search(query: str = Query(...), country: str = Query("us"), limit: int = Query(10)):
    results = search_apps(query, country=country, limit=limit)
    return results


@router.get("/{app_id}")
def get_app(app_id: str, country: str = Query("us")):
    name = lookup_app_name(app_id, country)
    return {"id": app_id, "name": name}
