# App Store Reviews Exporter

## Overview
A Streamlit web application that fetches Apple App Store user reviews via the public RSS JSON feed and exports them to Excel (.xlsx) files. Reviews can be filtered by time period or page count, and the app includes an Insights tab for review analysis.

## Recent Changes
- 2026-02-11: Added configurable fetch mode (by pages or time period: 1mo/3mo/6mo/1yr) and Insights tab with keyword extraction, rating distribution, review trends, negative/positive theme analysis, and version comparison.
- 2026-02-11: Initial build — Streamlit app with RSS feed fetching, review parsing, filtering, preview table, and Excel export with per-rating sheets.

## Project Architecture
- `app.py` — Main Streamlit application (single file, uses st.tabs for Reviews/Insights)
- `.streamlit/config.toml` — Streamlit server configuration (port 5000)
- Dependencies: streamlit, requests, pandas, openpyxl

## Key Features
- Configurable App ID, country code, and output filename
- Two fetch modes: by number of pages (1-50) or by time period (1 month to 1 year)
- Fetches from Apple RSS JSON feed (no scraping, no API keys)
- Displays star-rating breakdown metrics
- Preview table with rating filter and sort options
- Excel download with one sheet per rating (1_stelle through 5_stelle)
- Insights tab: rating distribution chart, reviews over time, keyword/bigram extraction, negative/positive theme analysis, version comparison

## User Preferences
- Italian locale default (country code "it")
- Sheet names in Italian (e.g. "1_stelle")
- Italian and English stop words for keyword extraction
