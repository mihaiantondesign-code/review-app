# App Store Reviews Exporter

## Overview
A Streamlit web application that fetches Apple App Store user reviews via the public RSS JSON feed and exports them to Excel (.xlsx) files. Reviews can be filtered by time period and page count (hybrid mode), and the app includes Insights and Comparison tabs with sentiment analysis.

## Recent Changes
- 2026-02-11: Hybrid fetch mode (both time period + max pages applied simultaneously), sentiment analysis per app (Insights + Comparison), version insights graphs (avg rating + review count by version).
- 2026-02-11: Added Comparison tab for multi-app analysis with add/remove app inputs, score overview table, rating distribution comparison chart, head-to-head problems/wins, and Excel download of all comparison data.
- 2026-02-11: Added configurable fetch mode (by pages or time period: 1mo/3mo/6mo/1yr) and Insights tab with keyword extraction, rating distribution, review trends, negative/positive theme analysis, and version comparison.
- 2026-02-11: Initial build — Streamlit app with RSS feed fetching, review parsing, filtering, preview table, and Excel export with per-rating sheets.

## Project Architecture
- `app.py` — Main Streamlit application (single file, uses st.tabs for Reviews/Insights/Comparison)
- `.streamlit/config.toml` — Streamlit server configuration (port 5000)
- Dependencies: streamlit, requests, pandas, openpyxl

## Key Features
- Configurable App ID, country code, and output filename
- Hybrid fetch mode: both time period slider (1mo/3mo/6mo/1yr) AND max pages (1-50) apply simultaneously — fetching stops at whichever limit is reached first
- Fetches from Apple RSS JSON feed (no scraping, no API keys)
- Displays star-rating breakdown metrics
- Preview table with rating filter and sort options
- Excel download with one sheet per rating (1_stelle through 5_stelle)
- Insights tab: sentiment analysis (keyword-based, IT+EN), rating distribution, problems/wins theme clustering, version insights graphs (avg rating + review count by version)
- Comparison tab: multi-app input (add/remove), score overview with sentiment + per-star breakdowns, sentiment comparison chart, rating distribution comparison, head-to-head problems & wins, combined Excel export

## Sentiment Analysis
- Keyword-based approach using curated positive/negative word lists in both Italian and English
- Score range: -1.0 (very negative) to +1.0 (very positive)
- Labels: Positive (>0.2), Negative (<-0.2), Mixed, Neutral
- Applied in both single-app Insights and multi-app Comparison

## User Preferences
- Italian locale default (country code "it")
- Sheet names in Italian (e.g. "1_stelle")
- Italian and English stop words for keyword extraction
