import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import apps, reviews, analysis, export, jobs, feedback

app = FastAPI(title="App Store Reviewer API", version="1.0.0")

# Explicit origins from env (comma-separated), e.g. custom domains
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001",
).split(",")

allowed_origin_regex = (
    r"https://review-app-.*\.vercel\.app"
    r"|https://.*-mihaiantondesign-codes-projects\.vercel\.app"
    r"|https://.*\.koyeb\.app"
    r"|http://localhost:\d+"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(apps.router)
app.include_router(reviews.router)
app.include_router(analysis.router)
app.include_router(export.router)
app.include_router(jobs.router)
app.include_router(feedback.router)


@app.get("/health")
def health():
    return {"status": "ok"}
