# App Store Reviews Exporter

## Overview
A Streamlit web application that fetches Apple App Store user reviews via the public RSS JSON feed and exports them to Excel (.xlsx) files. Reviews are filtered to the last 365 days and categorized by star rating.

## Recent Changes
- 2026-02-11: Initial build — Streamlit app with RSS feed fetching, review parsing, filtering, preview table, and Excel export with per-rating sheets.

## Project Architecture
- `app.py` — Main Streamlit application (single file)
- `.streamlit/config.toml` — Streamlit server configuration (port 5000)
- Dependencies: streamlit, requests, pandas, openpyxl

## Key Features
- Configurable App ID, country code, max pages, and output filename
- Fetches from Apple RSS JSON feed (no scraping, no API keys)
- Filters reviews to last 365 days
- Displays star-rating breakdown metrics
- Preview table of all fetched reviews
- Excel download with one sheet per rating (1_stelle through 5_stelle)

## User Preferences
- Italian locale default (country code "it")
- Sheet names in Italian (e.g. "1_stelle")
