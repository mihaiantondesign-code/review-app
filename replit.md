# App Store Reviews Exporter

## Overview
A Streamlit web application that fetches Apple App Store user reviews via the public RSS JSON feed and Trustpilot reviews via web scraping, exports them to Excel (.xlsx) files. Reviews can be filtered by time period and page count (hybrid mode), and the app includes Insights, Trustpilot, and Comparison tabs with sentiment analysis.

## Recent Changes
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

## Trustpilot Integration
- Scrapes `trustpilot.com/review/{domain}?languages=all&page={N}` with browser-like headers
- Extracts JSON from `<script id="__NEXT_DATA__">` via regex + json.loads
- 20 reviews per page, pagination auto-detected from response
- Business info extracted: displayName, trustScore, stars, numberOfReviews
- Session state keys: trustpilot_df, trustpilot_info
- Trustpilot tab only appears when domain is entered or data exists

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
