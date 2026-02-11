# App Store Reviews Exporter

## Overview
A Streamlit web application that fetches Apple App Store user reviews via the public RSS JSON feed and Trustpilot reviews via web scraping, exports them to Excel (.xlsx) files. Reviews can be filtered by time period and page count (hybrid mode), and the app includes Insights, Trustpilot, and Comparison tabs with sentiment analysis.

## Recent Changes
- 2026-02-11: Added Adjusted Rating feature — classifies reviews as app-related vs non-app (pricing, support, policy, external) using keyword matching in IT+EN. Shows original vs adjusted rating with delta, excluded count/%, category breakdown, and expandable excluded reviews table. Applied in Insights, Trustpilot, and Comparison tabs.
- 2026-02-11: Trustpilot fetch improved: domain input auto-cleans URLs, fallback from it.trustpilot.com to www.trustpilot.com on 404, switched to urllib for HTTP.
- 2026-02-11: Added Trustpilot integration via web scraping (__NEXT_DATA__ extraction), dedicated Trustpilot tab with full insights (sentiment, problems/wins, rating distribution), "view all matching reviews" expander for each theme in both Insights and Trustpilot tabs.
- 2026-02-11: Hybrid fetch mode (both time period + max pages applied simultaneously), sentiment analysis per app (Insights + Comparison), version insights graphs (avg rating + review count by version).
- 2026-02-11: Added Comparison tab for multi-app analysis with add/remove app inputs, score overview table, rating distribution comparison chart, head-to-head problems/wins, and Excel download of all comparison data.
- 2026-02-11: Added configurable fetch mode (by pages or time period: 1mo/3mo/6mo/1yr) and Insights tab with keyword extraction, rating distribution, review trends, negative/positive theme analysis, and version comparison.
- 2026-02-11: Initial build — Streamlit app with RSS feed fetching, review parsing, filtering, preview table, and Excel export with per-rating sheets.

## Project Architecture
- `app.py` — Main Streamlit application (single file, uses st.tabs for Reviews/Insights/Trustpilot/Comparison)
- `.streamlit/config.toml` — Streamlit server configuration (port 5000)
- Dependencies: streamlit, requests, pandas, openpyxl

## Key Features
- Configurable App ID, Trustpilot domain, country code, and output filename
- Hybrid fetch mode: both time period slider (1mo/3mo/6mo/1yr) AND max pages (1-50) apply simultaneously — fetching stops at whichever limit is reached first
- Fetches from Apple RSS JSON feed (no scraping, no API keys)
- Trustpilot scraping via __NEXT_DATA__ JSON extraction (no API key needed), uses `?languages=all` for full review coverage
- Displays star-rating breakdown metrics
- Preview table with rating filter and sort options
- Excel download with one sheet per rating (1_stelle through 5_stelle)
- Insights tab: sentiment analysis (keyword-based, IT+EN), rating distribution, problems/wins theme clustering with "view all matching reviews", version insights graphs
- Trustpilot tab: business info (TrustScore, stars, total reviews), full insights mirroring App Store tab, review table with filtering, Excel export
- Comparison tab: multi-app input (add/remove), score overview with sentiment + per-star breakdowns, sentiment comparison chart, rating distribution comparison, head-to-head problems & wins, combined Excel export

## Adjusted Rating
- classify_review() categorizes each review as app_related or non_app with a subcategory (pricing, support, policy, external)
- Uses curated keyword sets in both Italian and English for each category
- Mixed reviews: non-app must have 1.5x more keyword hits than app-related to be excluded
- compute_adjusted_metrics() returns original vs adjusted rating, delta, excluded count/%, category breakdown
- render_adjusted_rating_card() displays metrics with expandable excluded reviews table
- Applied in render_insights_section (Insights + Trustpilot tabs) and Comparison tab Score Overview

## Trustpilot Integration
- Scrapes `it.trustpilot.com/review/{domain}?page={N}` with urllib, falls back to www.trustpilot.com on 404
- Domain input auto-cleans full URLs, strips query params, trailing slashes
- Extracts JSON from `<script id="__NEXT_DATA__">` via regex + json.loads
- 20 reviews per page, pagination auto-detected from response
- Business info extracted: displayName, trustScore, stars, numberOfReviews
- Session state keys: trustpilot_df, trustpilot_info
- Trustpilot tab always visible with independent controls

## Sentiment Analysis
- Keyword-based approach using curated positive/negative word lists in both Italian and English
- Score range: -1.0 (very negative) to +1.0 (very positive)
- Labels: Positive (>0.2), Negative (<-0.2), Mixed, Neutral
- Applied in single-app Insights, Trustpilot tab, and multi-app Comparison

## Theme Clustering
- cluster_reviews_by_theme returns all_matching_indices for expandable review lists
- render_themes_with_all_reviews renders themes with "View all N matching reviews" button
- render_insights_section provides consistent insights UI for both App Store and Trustpilot

## User Preferences
- Italian locale default (country code "it")
- Sheet names in Italian (e.g. "1_stelle")
- Italian and English stop words for keyword extraction
