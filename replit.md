# App Store Reviewer — mihAI

## Overview
A Streamlit web application that fetches Apple App Store user reviews via the public RSS JSON feed and Trustpilot reviews via web scraping, exports them to Excel (.xlsx) files. Uses a segmented control navigation with three sections: App Store (Reviews + Insights), Trustpilot, and Comparison. Includes sentiment analysis, adjusted rating metrics, and Apple-inspired design system.

## Recent Changes
- 2026-02-12: Apple/Ive-inspired design overhaul — Inter font, pill-shaped buttons, frosted glass header, soft shadows, 12px radii. Fixed number input "arrow down" bug via CSS spinner hiding. Replaced deprecated `use_container_width` with `width="stretch"`. Theme config updated to Apple palette (#0071E3 accent, #F5F5F7 bg).
- 2026-02-12: Major UI refactor — replaced tabs with segmented control navigation (App Store / Trustpilot / Comparison). Added logo top-left sidebar, title changed to "app store reviewer". Fetch mode: "Time period" (month slider 1-24 OR precision dates) vs "Pages" (1-50). Removed output filename. Illustrative empty states. Comparison auto-populates from sidebar App ID.
- 2026-02-11: Added Adjusted Rating feature — classifies reviews as app-related vs non-app using keyword matching in IT+EN.
- 2026-02-11: Trustpilot integration via web scraping (__NEXT_DATA__ extraction).
- 2026-02-11: Sentiment analysis, version insights, comparison tab, Excel export.
- 2026-02-11: Initial build — Streamlit app with RSS feed fetching, review parsing.

## Project Architecture
- `app.py` — Main Streamlit application (single file, segmented control navigation)
- `static/logo.png` — mihAI logo displayed top-left in sidebar (base64-encoded inline)
- `.streamlit/config.toml` — Streamlit server configuration (port 5000, Apple theme)
- Dependencies: streamlit, requests, pandas, openpyxl

## Design System
- Apple/Jony Ive inspired: premium, minimal, generous whitespace
- Font: Inter (Google Fonts CDN), fallback -apple-system/SF Pro
- Colors: pure black #000000 primary, #F5F5F7 secondary bg, #FBFBFD tertiary, rgba borders
- Accent: #0071E3 (Apple blue) for focus states
- Buttons: pill-shaped (border-radius: 980px), black primary, transparent secondary
- Transitions: cubic-bezier(0.25, 0.1, 0.25, 1) for Apple-like feel
- Header: frosted glass with backdrop-filter blur(20px)
- Shadows: 3-tier system (sm/md/lg) using subtle rgba
- Metrics: 12px radius, soft shadow, 24px values
- Empty states: 80px padding, 56px icon, 16px radius card
- Number inputs: native spinners hidden via CSS (fixes arrow-down bug)
- Sidebar headers: 11px uppercase, 600 weight, secondary color
- Dataframes: `width="stretch"` (updated from deprecated `use_container_width`)

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
- Precision dates: both from and to dates are applied (to_date filters upper bound after fetch)

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
