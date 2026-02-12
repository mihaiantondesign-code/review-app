# App Store Reviewer — mihAI

## Overview
A Streamlit web application that fetches Apple App Store user reviews via the public RSS JSON feed and Trustpilot reviews via web scraping, exports them to Excel (.xlsx) files. Uses a segmented control navigation with three sections: App Store (Reviews + Insights), Trustpilot, and Comparison. Includes sentiment analysis, adjusted rating metrics, and Qonto-inspired design system.

## Recent Changes
- 2026-02-12: Major UI refactor — replaced tabs with segmented control navigation (App Store / Trustpilot / Comparison). Added logo top-left sidebar, title changed to "app store reviewer". Fetch mode reworked: separate "Time period" (month slider 1-24 OR precision date picker) vs "Pages" (1-50). Removed output filename. Created illustrative empty states. Comparison auto-populates first app from sidebar App ID. Merged Reviews+Insights into single App Store section.
- 2026-02-11: Added Adjusted Rating feature — classifies reviews as app-related vs non-app using keyword matching in IT+EN.
- 2026-02-11: Trustpilot fetch improved: domain input auto-cleans URLs, fallback to www.trustpilot.com on 404.
- 2026-02-11: Added Trustpilot integration via web scraping (__NEXT_DATA__ extraction).
- 2026-02-11: Hybrid fetch mode, sentiment analysis, version insights graphs.
- 2026-02-11: Added Comparison tab for multi-app analysis.
- 2026-02-11: Initial build — Streamlit app with RSS feed fetching, review parsing, Excel export.

## Project Architecture
- `app.py` — Main Streamlit application (single file, uses segmented control for App Store/Trustpilot/Comparison sections)
- `static/logo.png` — mihAI logo displayed top-left in sidebar (base64-encoded inline)
- `.streamlit/config.toml` — Streamlit server configuration (port 5000)
- Dependencies: streamlit, requests, pandas, openpyxl

## Design System
- Qonto-inspired: clean, minimal, professional fintech aesthetic
- Font: Overused Grotesk (loaded from GitHub CDN)
- Colors: primary dark #1B1B19, background white #FFFFFF, sidebar #F7F7F5, borders #E5E5E3
- Primary buttons: dark #1B1B19 with subtle border
- Navigation: segmented control (3 buttons: App Store / Trustpilot / Comparison) using session_state.active_section
- Empty states: centered card with icon, title, description (class .empty-state)
- Sidebar headers: uppercase, small, gray (## Markdown → CSS-styled)

## Navigation & Sections
- Session state key `active_section` controls which section is visible
- **App Store**: Reviews table + rating breakdown + drilldown + Insights (sentiment, problems/wins, version charts) — all on one page
- **Trustpilot**: Independent domain input, fetch controls, business info, insights, review table, Excel export
- **Comparison**: Multi-app input (auto-populates first from sidebar), score overview, sentiment comparison, rating distribution, head-to-head

## Fetch Modes (Sidebar)
- Radio: "Time period" or "Pages"
- Time period mode: slider 1-24 months (step=1) OR checkbox "Precision dates" with from/to date inputs
- Pages mode: number input 1-50
- When "Time period" is selected, max_pages defaults to 50 (fetches until cutoff)
- When "Pages" is selected, cutoff is 10 years (effectively unlimited)

## Key Features
- Configurable App ID, country code in sidebar
- Fetches from Apple RSS JSON feed (no scraping, no API keys)
- Trustpilot scraping via __NEXT_DATA__ JSON extraction (no API key needed)
- Illustrative empty states with centered icon/text
- Star-rating breakdown metrics, drilldown by rating
- Excel download with one sheet per rating (1_stelle through 5_stelle)
- Insights: sentiment analysis, rating distribution, problems/wins theme clustering, version insights
- Comparison: auto-populates first app from sidebar, multi-app add/remove, score overview, head-to-head

## Adjusted Rating
- classify_review() categorizes each review as app_related or non_app with subcategory
- Uses curated keyword sets in both Italian and English
- compute_adjusted_metrics() returns original vs adjusted rating, delta, excluded count/%
- render_adjusted_rating_card() displays metrics with expandable excluded reviews table

## Trustpilot Integration
- Scrapes trustpilot.com/review/{domain} with urllib, falls back to www.trustpilot.com on 404
- Domain input auto-cleans full URLs, strips query params
- Extracts JSON from __NEXT_DATA__ script tag
- Business info: displayName, trustScore, stars, numberOfReviews

## Sentiment Analysis
- Keyword-based with curated positive/negative word lists in Italian and English
- Score range: -1.0 to +1.0, Labels: Positive/Negative/Mixed/Neutral

## User Preferences
- Italian locale default (country code "it")
- Sheet names in Italian (e.g. "1_stelle")
- Italian and English stop words for keyword extraction
