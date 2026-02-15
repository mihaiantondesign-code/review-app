import uuid
import threading
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.appstore import fetch_reviews_simple
from app.services.trustpilot import clean_domain, fetch_reviews_simple as tp_fetch_reviews_simple

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# In-memory job store: job_id -> job dict
_jobs: dict[str, dict] = {}


def _run_appstore(job_id: str, app_id: str, country: str, max_pages: int, cutoff_date: datetime):
    try:
        _jobs[job_id]["status"] = "running"
        reviews = fetch_reviews_simple(app_id, country, max_pages, cutoff_date)
        _jobs[job_id]["reviews"] = [
            {**r, "date": r["date"].isoformat() if hasattr(r["date"], "isoformat") else r["date"]}
            for r in reviews
        ]
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["total"] = len(reviews)
    except Exception as e:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(e)


def _run_trustpilot(job_id: str, domain: str, max_pages: int, cutoff_date: datetime):
    try:
        _jobs[job_id]["status"] = "running"
        reviews, business_info = tp_fetch_reviews_simple(domain, max_pages, cutoff_date)
        _jobs[job_id]["reviews"] = [
            {**r, "date": r["date"].isoformat() if hasattr(r["date"], "isoformat") else r["date"]}
            for r in reviews
        ]
        _jobs[job_id]["business_info"] = business_info
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["total"] = len(reviews)
    except Exception as e:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(e)


class AppStoreJobRequest(BaseModel):
    app_id: str
    country: str = "it"
    max_pages: int = 10
    cutoff_days: int = 365


class TrustpilotJobRequest(BaseModel):
    domain: str
    max_pages: int = 10
    cutoff_days: int = 365


@router.post("/appstore/start")
def start_appstore_job(req: AppStoreJobRequest):
    job_id = str(uuid.uuid4())
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=req.cutoff_days)
    _jobs[job_id] = {"status": "pending", "total": 0, "reviews": [], "business_info": None}
    thread = threading.Thread(
        target=_run_appstore,
        args=(job_id, req.app_id, req.country, req.max_pages, cutoff_date),
        daemon=True,
    )
    thread.start()
    return {"job_id": job_id}


@router.post("/trustpilot/start")
def start_trustpilot_job(req: TrustpilotJobRequest):
    job_id = str(uuid.uuid4())
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=req.cutoff_days)
    domain = clean_domain(req.domain)
    _jobs[job_id] = {"status": "pending", "total": 0, "reviews": [], "business_info": None}
    thread = threading.Thread(
        target=_run_trustpilot,
        args=(job_id, domain, req.max_pages, cutoff_date),
        daemon=True,
    )
    thread.start()
    return {"job_id": job_id}


@router.get("/status/{job_id}")
def get_job_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "status": job["status"],
        "total": job["total"],
        "error": job.get("error"),
    }


@router.get("/result/{job_id}")
def get_job_result(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "done":
        raise HTTPException(status_code=400, detail="Job not complete yet")
    return {
        "reviews": job["reviews"],
        "total": job["total"],
        "business_info": job.get("business_info"),
    }
