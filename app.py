import streamlit as st
import requests
import pandas as pd
import re
import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from io import BytesIO

st.set_page_config(page_title="app store reviewer — mihAI", page_icon="🔍", layout="wide")


st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {{
    --primary: #000000;
    --bg: #FFFFFF;
    --bg-secondary: #F5F5F7;
    --bg-tertiary: #FBFBFD;
    --border: rgba(0,0,0,0.06);
    --border-strong: rgba(0,0,0,0.1);
    --text-primary: #1D1D1F;
    --text-secondary: #86868B;
    --text-tertiary: #AEAEB2;
    --accent: #0071E3;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04);
    --shadow-lg: 0 4px 16px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04);
}}

/* Dark scrollbar for st.container(height=...) inside sidebar expander */
[data-testid="stVerticalBlockBorderWrapper"] > div[style*="overflow"] {{
    scrollbar-width: thin !important;
    scrollbar-color: #1D1D1F transparent !important;
}}
[data-testid="stVerticalBlockBorderWrapper"] > div[style*="overflow"]::-webkit-scrollbar {{
    width: 5px !important;
}}
[data-testid="stVerticalBlockBorderWrapper"] > div[style*="overflow"]::-webkit-scrollbar-thumb {{
    background: #1D1D1F !important;
    border-radius: 4px !important;
}}
[data-testid="stVerticalBlockBorderWrapper"] > div[style*="overflow"]::-webkit-scrollbar-track {{
    background: transparent !important;
}}

html, body, [class*="css"] {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}}

h1, h2, h3, h4, h5, h6,
.stMarkdown h1, .stMarkdown h2, .stMarkdown h3 {{
    font-family: 'Inter', -apple-system, 'SF Pro Display', sans-serif !important;
    font-weight: 600 !important;
    color: var(--text-primary) !important;
    letter-spacing: -0.025em;
}}

p, span, label, div, li, td, th, input, textarea, select {{
    font-family: 'Inter', -apple-system, sans-serif !important;
}}

header[data-testid="stHeader"] {{
    background: rgba(255,255,255,0.72) !important;
    backdrop-filter: saturate(180%) blur(20px) !important;
    -webkit-backdrop-filter: saturate(180%) blur(20px) !important;
    border-bottom: 1px solid var(--border) !important;
}}

.stApp {{
    background-color: var(--bg) !important;
}}

section[data-testid="stSidebar"] {{
    background-color: var(--bg-secondary) !important;
    border-right: 1px solid var(--border) !important;
}}

section[data-testid="stSidebar"] .stMarkdown h2 {{
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary) !important;
    margin-bottom: 4px !important;
    margin-top: 16px !important;
}}

/* ── Primary buttons (Fetch, Download — black bg white text) ── */
.stButton > button[kind="primary"],
.stDownloadButton > button[kind="primary"],
button[data-testid="stBaseButton-primary"] {{
    background-color: #1D1D1F !important;
    color: #FFFFFF !important;
    border: none !important;
    border-radius: 980px !important;
    font-family: 'Inter', -apple-system, sans-serif !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    padding: 10px 24px !important;
    transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1) !important;
    box-shadow: none !important;
    letter-spacing: -0.01em;
}}
.stButton > button[kind="primary"]:hover,
.stDownloadButton > button[kind="primary"]:hover,
button[data-testid="stBaseButton-primary"]:hover {{
    background-color: #000000 !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
}}
button[data-testid="stBaseButton-primary"]:disabled {{
    background-color: rgba(0,0,0,0.06) !important;
    color: rgba(0,0,0,0.3) !important;
}}

/* ── Secondary / segment buttons ── */
.stButton > button[kind="secondary"],
button[data-testid="stBaseButton-secondary"] {{
    background-color: transparent !important;
    color: var(--text-secondary) !important;
    border: none !important;
    border-radius: 980px !important;
    font-family: 'Inter', -apple-system, sans-serif !important;
    font-weight: 500 !important;
    font-size: 14px !important;
    padding: 10px 24px !important;
    box-shadow: none !important;
    transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1) !important;
}}
.stButton > button[kind="secondary"]:hover,
button[data-testid="stBaseButton-secondary"]:hover {{
    background-color: rgba(0,0,0,0.04) !important;
    color: var(--text-primary) !important;
}}

/* ── Sidebar app list buttons ── */
[data-testid="stSidebar"] [data-testid="stVerticalBlockBorderWrapper"] button[data-testid="stBaseButton-secondary"] {{
    font-size: 13px !important;
    padding: 6px 10px !important;
    text-align: left !important;
    border-radius: 8px !important;
    line-height: 1.3 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}}

/* ── Metrics ── */
[data-testid="stMetric"] {{
    background: var(--bg-tertiary) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-md) !important;
    padding: 20px !important;
    box-shadow: var(--shadow-sm) !important;
}}
[data-testid="stMetricLabel"] {{
    font-size: 11px !important;
    font-weight: 600 !important;
    color: var(--text-secondary) !important;
    text-transform: uppercase !important;
    letter-spacing: 0.04em !important;
}}
[data-testid="stMetricValue"] {{
    font-size: 24px !important;
    font-weight: 700 !important;
    color: var(--text-primary) !important;
    letter-spacing: -0.02em !important;
}}

/* ── Expanders ── */
details[data-testid="stExpander"] {{
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-md) !important;
    box-shadow: var(--shadow-sm) !important;
    overflow: hidden;
}}
details[data-testid="stExpander"] summary {{
    font-weight: 500 !important;
    padding: 14px 16px !important;
}}

/* ── Dataframes ── */
.stDataFrame {{
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-md) !important;
    box-shadow: var(--shadow-sm) !important;
    overflow: hidden;
}}

/* ── Inputs — fix arrow/spinner bug ── */
.stTextInput > div > div > input,
.stNumberInput > div > div > input,
.stSelectbox > div > div {{
    border: 1px solid var(--border-strong) !important;
    border-radius: var(--radius-sm) !important;
    font-family: 'Inter', -apple-system, sans-serif !important;
    font-size: 14px !important;
    padding: 8px 12px !important;
    background: var(--bg) !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
}}
.stTextInput > div > div > input:focus,
.stNumberInput > div > div > input:focus {{
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px rgba(0,113,227,0.15) !important;
    outline: none !important;
}}

/* Hide number input step buttons that render as broken arrows */
.stNumberInput button[data-testid="stBaseButton-minimalIcon"],
.stNumberInput [data-testid="stNumberInputStepUp"],
.stNumberInput [data-testid="stNumberInputStepDown"] {{
    opacity: 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
}}
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {{
    -webkit-appearance: none;
    margin: 0;
}}
input[type="number"] {{
    -moz-appearance: textfield;
    appearance: textfield;
}}

/* ── Selectbox arrow fix ── */
.stSelectbox svg {{
    display: block !important;
    opacity: 0.5;
}}

/* ── Dividers ── */
hr {{
    border: none !important;
    border-top: 1px solid var(--border) !important;
    margin: 24px 0 !important;
}}

/* ── Progress ── */
.stProgress > div > div > div > div {{
    background: linear-gradient(90deg, var(--primary), #333) !important;
    border-radius: 4px !important;
}}

/* ── Alerts ── */
.stAlert {{
    border-radius: var(--radius-md) !important;
    font-size: 14px !important;
    border: 1px solid var(--border) !important;
}}

/* ── Captions ── */
.stCaption, [data-testid="stCaptionContainer"] {{
    color: var(--text-secondary) !important;
    font-size: 13px !important;
    line-height: 1.5;
}}

/* ── Headings ── */
.stMarkdown h3 {{
    font-size: 22px !important;
    font-weight: 600 !important;
    margin-top: 0.5em !important;
    letter-spacing: -0.02em;
}}

/* ── Empty State ── */
.empty-state {{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 32px;
    text-align: center;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    margin: 24px 0;
}}
.empty-state .empty-icon {{
    font-size: 56px;
    margin-bottom: 20px;
    filter: grayscale(30%);
}}
.empty-state .empty-title {{
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
    letter-spacing: -0.02em;
}}
.empty-state .empty-desc {{
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 15px;
    color: var(--text-secondary);
    max-width: 360px;
    line-height: 1.5;
}}

/* ── Radio buttons ── */
.stRadio > div {{
    gap: 0 !important;
}}
.stRadio label {{
    font-size: 14px !important;
    font-weight: 500 !important;
}}

/* ── Slider ── */
.stSlider [data-testid="stThumbValue"] {{
    font-weight: 600 !important;
    font-size: 13px !important;
}}

/* ── Checkbox ── */
.stCheckbox label {{
    font-size: 14px !important;
}}

/* ── Label styling ── */
.stTextInput label, .stNumberInput label, .stSelectbox label,
.stMultiSelect label, .stDateInput label, .stSlider label,
.stRadio label, .stCheckbox label {{
    font-size: 13px !important;
    font-weight: 500 !important;
    color: var(--text-primary) !important;
}}

/* ── Bar chart ── */
.stBarChart {{
    border-radius: var(--radius-md);
}}

/* ── Download button ── */
.stDownloadButton {{
    margin-top: 8px;
}}

/* ── Sidebar title ── */
section[data-testid="stSidebar"] .stMarkdown h1 {{
    display: none !important;
}}
</style>
""", unsafe_allow_html=True)

for key, default in [
    ("reviews_df", None),
    ("fetch_done", False),
    ("trustpilot_df", None),
    ("trustpilot_info", None),
    ("tp_fetch_done", False),
    ("comp_apps", []),
    ("comp_data", {}),
    ("comp_fetched", False),
]:
    if key not in st.session_state:
        st.session_state[key] = default


def build_url(country, app_id, page=1):
    return f"https://itunes.apple.com/{country}/rss/customerreviews/page={page}/id={app_id}/sortBy=mostRecent/json"


def lookup_app_name(app_id, country="us"):
    try:
        resp = requests.get(
            f"https://itunes.apple.com/lookup?id={app_id}&country={country}",
            timeout=10,
        )
        data = resp.json()
        results = data.get("results", [])
        if results:
            return results[0].get("trackName", f"App {app_id}")
    except Exception:
        pass
    return f"App {app_id}"


def search_apps(query, country="us", limit=10):
    try:
        resp = requests.get(
            "https://itunes.apple.com/search",
            params={
                "term": query,
                "entity": "software",
                "country": country,
                "limit": limit,
            },
            timeout=10,
        )
        data = resp.json()
        results = []
        for r in data.get("results", []):
            results.append({
                "id": str(r.get("trackId", "")),
                "name": r.get("trackName", ""),
                "developer": r.get("artistName", ""),
                "icon": r.get("artworkUrl60", ""),
                "bundle": r.get("bundleId", ""),
                "price": r.get("formattedPrice", "Free"),
                "rating": r.get("averageUserRating", 0),
                "ratings_count": r.get("userRatingCount", 0),
            })
        return results
    except Exception:
        return []


def parse_entry(entry):
    try:
        review_text = entry.get("content", {}).get("label", "")
        title = entry.get("title", {}).get("label", "")
        rating = entry.get("im:rating", {}).get("label", "")
        date_str = entry.get("updated", {}).get("label", "")
        author = entry.get("author", {}).get("name", {}).get("label", "")
        version_info = entry.get("im:version", {})
        version = version_info.get("label", "N/A") if isinstance(version_info, dict) else "N/A"
        review_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")) if date_str else None
        return {
            "date": review_date,
            "rating": int(rating) if rating else None,
            "title": title,
            "review": review_text,
            "author": author,
            "version": version,
        }
    except Exception:
        return None


def _clean_trustpilot_domain(raw_input):
    d = raw_input.strip()
    d = d.rstrip("/")
    for prefix in [
        "https://it.trustpilot.com/review/",
        "https://www.trustpilot.com/review/",
        "http://it.trustpilot.com/review/",
        "http://www.trustpilot.com/review/",
        "it.trustpilot.com/review/",
        "www.trustpilot.com/review/",
        "trustpilot.com/review/",
        "https://", "http://", "www.",
    ]:
        if d.lower().startswith(prefix):
            d = d[len(prefix):]
            break
    d = d.split("?")[0].split("#")[0].strip("/")
    return d


def _fetch_trustpilot_page(domain, page):
    import urllib.request
    import ssl

    _headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "it-IT,it;q=0.9",
    }
    ctx = ssl.create_default_context()

    for host in ["it.trustpilot.com", "www.trustpilot.com"]:
        url = f"https://{host}/review/{domain}?page={page}"
        req = urllib.request.Request(url, headers=_headers)
        try:
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                raw = resp.read()
                html = raw.decode("utf-8", errors="replace")
                return resp.status, html
        except urllib.request.HTTPError as e:
            if e.code == 404 and host == "it.trustpilot.com":
                continue
            raise

    raise Exception(f"Domain '{domain}' not found on Trustpilot (404 on both it. and www. subdomains)")


def fetch_trustpilot_reviews(domain, max_pages, cutoff_date, progress_bar=None, status_text=None):
    all_reviews = []
    business_info = None

    for page in range(1, max_pages + 1):
        if progress_bar:
            progress_bar.progress(page / max_pages, text=f"Trustpilot page {page}/{max_pages}...")
        if status_text:
            status_text.text(f"Fetching Trustpilot page {page}...")

        try:
            status_code, html = _fetch_trustpilot_page(domain, page)

            if status_text:
                status_text.text(f"Page {page}: HTTP {status_code}, {len(html)} bytes received")

            if status_code != 200:
                if status_text:
                    status_text.warning(f"Trustpilot page {page}: HTTP {status_code}")
                break

            if len(html) < 1000:
                if status_text:
                    status_text.warning(f"Trustpilot page {page}: Response too short ({len(html)} bytes) — site may be blocking requests")
                break

            match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
            if not match:
                if status_text:
                    status_text.warning(f"Trustpilot page {page}: Could not find review data in page (HTML: {len(html)} bytes)")
                break

            nd = json.loads(match.group(1))
            props = nd.get("props", {}).get("pageProps", {})

            if page == 1:
                bu = props.get("businessUnit", {})
                business_info = {
                    "name": bu.get("displayName", domain),
                    "trustScore": bu.get("trustScore", 0),
                    "stars": bu.get("stars", 0),
                    "totalReviews": bu.get("numberOfReviews", 0),
                }
                pagination = props.get("filters", {}).get("pagination", {})
                total_pages = pagination.get("totalPages", 1)
                total_count = pagination.get("totalCount", 0)
                if status_text:
                    status_text.text(f"Found {business_info['name']} — {total_count} reviews across {total_pages} pages")
                if max_pages > total_pages:
                    max_pages = total_pages

            reviews = props.get("reviews", [])
            if not reviews:
                if status_text:
                    status_text.text(f"No more reviews at page {page}. Stopping.")
                break

            all_too_old = True
            page_count = 0
            for r in reviews:
                try:
                    dates = r.get("dates", {})
                    pub_date_str = dates.get("publishedDate", "")
                    if pub_date_str:
                        pub_date = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                    else:
                        continue

                    if pub_date < cutoff_date:
                        continue

                    all_too_old = False
                    page_count += 1
                    all_reviews.append({
                        "date": pub_date,
                        "rating": r.get("rating", 0),
                        "title": r.get("title", ""),
                        "review": r.get("text", ""),
                        "author": r.get("consumer", {}).get("displayName", ""),
                        "version": "N/A",
                    })
                except Exception:
                    continue

            if status_text:
                status_text.text(f"Page {page}: {page_count} reviews in date range (total so far: {len(all_reviews)})")

            if all_too_old and page > 1:
                if status_text:
                    status_text.text(f"All reviews on page {page} are too old. Stopping.")
                break

        except Exception as e:
            if status_text:
                status_text.warning(f"Trustpilot page {page}: {type(e).__name__}: {e}")
            break

    if progress_bar:
        progress_bar.progress(1.0, text="Trustpilot done!")

    return all_reviews, business_info


def fetch_reviews_simple(app_id, country, max_pages, cutoff_date):
    all_reviews = []
    for page in range(1, max_pages + 1):
        url = build_url(country, app_id, page)
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            data = response.json()
        except Exception:
            break

        feed = data.get("feed", {})
        entries = feed.get("entry", [])
        if not entries:
            break

        all_too_old = True
        for entry in entries:
            parsed = parse_entry(entry)
            if parsed and parsed["date"] and parsed["rating"]:
                if parsed["date"] >= cutoff_date:
                    all_reviews.append(parsed)
                    all_too_old = False

        if all_too_old and page > 1:
            break

    return all_reviews


def fetch_reviews(app_id, country, max_pages, cutoff_date, progress_bar, status_text):
    all_reviews = []

    for page in range(1, max_pages + 1):
        progress_bar.progress(page / max_pages, text=f"Fetching page {page}/{max_pages}...")
        status_text.text(f"Fetching page {page}/{max_pages}...")

        url = build_url(country, app_id, page)
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            status_text.warning(f"Page {page}: Network error — {e}")
            break
        except ValueError:
            status_text.warning(f"Page {page}: Invalid JSON response")
            break

        feed = data.get("feed", {})
        entries = feed.get("entry", [])

        if not entries:
            status_text.text(f"No more entries at page {page}. Stopping.")
            break

        page_count = 0
        all_too_old = True
        for entry in entries:
            parsed = parse_entry(entry)
            if parsed and parsed["date"] and parsed["rating"]:
                if parsed["date"] >= cutoff_date:
                    all_reviews.append(parsed)
                    page_count += 1
                    all_too_old = False

        status_text.text(f"Page {page}: found {page_count} recent reviews")

        if all_too_old and page > 1:
            status_text.text(f"All reviews on page {page} are outside the time range. Stopping.")
            break

    progress_bar.progress(1.0, text="Done!")
    return all_reviews


def create_excel(df):
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        for rating in range(1, 6):
            sheet_name = f"{rating}_stelle"
            rating_df = df[df["rating"] == rating].copy()
            if not rating_df.empty:
                rating_df["date"] = rating_df["date"].dt.strftime("%Y-%m-%d %H:%M")
            rating_df.to_excel(writer, sheet_name=sheet_name, index=False)
    output.seek(0)
    return output


def create_comparison_excel(comp_data, app_names):
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        for app_id, app_df in comp_data.items():
            name = app_names.get(app_id, app_id)
            sheet_name = re.sub(r'[\\/*?:\[\]]', '', name)[:31]
            export_df = app_df.copy()
            if not export_df.empty:
                export_df["date"] = export_df["date"].dt.strftime("%Y-%m-%d %H:%M")
            export_df.to_excel(writer, sheet_name=sheet_name, index=False)
    output.seek(0)
    return output


STOP_WORDS = {
    "the", "a", "an", "is", "it", "in", "to", "and", "of", "for", "on",
    "with", "that", "this", "but", "not", "are", "was", "has", "have",
    "had", "be", "been", "will", "can", "do", "does", "did", "i", "my",
    "me", "we", "our", "you", "your", "they", "them", "their", "he",
    "she", "his", "her", "its", "so", "if", "or", "as", "at", "by",
    "from", "up", "out", "no", "all", "just", "about", "very", "too",
    "also", "than", "then", "when", "what", "which", "who", "how",
    "would", "could", "should", "there", "here", "more", "some", "any",
    "other", "only", "even", "after", "before", "because", "while",
    "where", "why", "each", "every", "both", "few", "most", "own",
    "same", "such", "into", "over", "through", "between", "during",
    "get", "got", "like", "one", "two", "much", "many", "make",
    "made", "well", "back", "still", "way", "use", "used", "app",
    "non", "che", "di", "il", "la", "le", "lo", "un", "una", "per",
    "con", "del", "della", "delle", "dei", "degli", "nel", "nella",
    "nelle", "nei", "negli", "sul", "sulla", "sulle", "sui", "sugli",
    "al", "alla", "alle", "ai", "agli", "da", "come", "sono", "si",
    "mi", "ci", "vi", "ti", "se", "ma", "ed", "ha", "ho", "più",
    "anche", "solo", "essere", "stato", "stata", "molto", "tutto",
    "questa", "questo", "questi", "queste", "poi", "già", "dopo",
    "prima", "sempre", "mai", "ogni", "altro", "altra", "altri",
    "altre", "suo", "sua", "suoi", "sue", "mio", "mia", "miei",
    "mie", "tuo", "tua", "tuoi", "tue", "loro", "nostro", "nostra",
    "vostro", "vostra", "fatto", "fare", "può", "però", "cosa",
    "dove", "quando", "perché", "tra", "fra", "ancora", "così",
    "bene", "male", "ora", "qui", "proprio", "senza", "cui",
    "oppure", "fino", "verso", "sopra", "sotto", "fuori", "dentro",
    "parte", "volta", "anno", "anni", "giorno", "giorni",
}

POSITIVE_WORDS = {
    "great", "excellent", "amazing", "love", "best", "perfect", "awesome",
    "fantastic", "good", "wonderful", "helpful", "easy", "beautiful",
    "recommend", "useful", "nice", "brilliant", "superb", "outstanding",
    "intuitive", "smooth", "fast", "reliable", "convenient", "favorite",
    "enjoy", "happy", "pleased", "satisfied", "impressive", "simple",
    "clean", "elegant", "powerful", "efficient", "quick", "stable",
    "ottimo", "ottima", "eccellente", "fantastico", "fantastica",
    "perfetto", "perfetta", "bellissimo", "bellissima", "stupendo",
    "stupenda", "comodo", "comoda", "utile", "facile", "veloce",
    "affidabile", "consiglio", "consigliato", "pratico", "pratica",
    "funziona", "funzionale", "intuitivo", "intuitiva", "soddisfatto",
    "soddisfatta", "contento", "contenta", "bravi", "bravo", "brava",
    "migliore", "semplice", "efficiente", "stabile", "meraviglioso",
    "meravigliosa", "adoro", "eccezionale", "splendido", "splendida",
}

NEGATIVE_WORDS = {
    "bad", "terrible", "horrible", "worst", "hate", "awful", "poor",
    "useless", "broken", "slow", "crash", "bug", "error", "annoying",
    "frustrating", "disappointing", "waste", "ugly", "complicated",
    "confusing", "unreliable", "expensive", "laggy", "glitch",
    "freeze", "stuck", "problem", "issue", "fail", "failed", "spam",
    "scam", "sucks", "unusable", "nightmare", "ridiculous", "lacking",
    "pessimo", "pessima", "terribile", "orribile", "brutto", "brutta",
    "lento", "lenta", "inutile", "rotto", "rotta", "crash",
    "errore", "fastidioso", "fastidiosa", "frustrante", "deludente",
    "complicato", "complicata", "confuso", "confusa", "costoso",
    "costosa", "problema", "problemi", "difetto", "difetti",
    "blocca", "bloccato", "bloccata", "peggiore", "schifo",
    "vergogna", "vergognoso", "vergognosa", "incapaci",
    "malfunzionamento", "disastro", "disastroso", "disastrosa",
}


NON_APP_CATEGORIES = {
    "pricing": {
        "price", "pricing", "cost", "expensive", "cheap", "fee", "fees",
        "subscription", "subscriptions", "subscribe", "payment", "pay",
        "charge", "charged", "charges", "billing", "bill", "bills",
        "refund", "refunds", "money", "euro", "euros", "dollar", "dollars",
        "purchase", "purchases", "bought", "buy", "buying", "afford",
        "overpriced", "overcharge", "premium", "trial", "free", "freemium",
        "in-app", "iap", "microtransaction", "microtransactions",
        "prezzo", "prezzi", "costo", "costi", "costoso", "costosa",
        "abbonamento", "abbonamenti", "abbonare", "pagamento", "pagamenti",
        "pagare", "addebito", "addebitato", "addebitati", "addebiti",
        "rimborso", "rimborsi", "soldi", "spesa", "spese", "gratis",
        "gratuito", "gratuita", "acquisto", "acquisti", "comprare",
        "canone", "tariffe", "tariffa", "commissione", "commissioni",
    },
    "support": {
        "support", "customer service", "helpdesk", "help desk", "ticket",
        "tickets", "agent", "agents", "operator", "operators", "call center",
        "callcenter", "hotline", "representative", "representatives",
        "response time", "waiting", "waited", "wait", "hold", "queue",
        "unresponsive", "rude", "unhelpful", "ignored", "assistenza",
        "operatore", "operatori", "servizio clienti", "centralino",
        "risposta", "attesa", "aspettare", "aspettato", "ignorato",
        "ignorata", "maleducato", "maleducata", "chiamata", "chiamate",
        "contattare", "contatto", "reclamo", "reclami", "segnalazione",
    },
    "policy": {
        "policy", "policies", "terms", "conditions", "agreement",
        "regulation", "regulations", "compliance", "legal", "contract",
        "contracts", "clause", "clauses", "privacy", "gdpr", "data protection",
        "unfair", "deceptive", "misleading", "scam", "fraud", "fraudulent",
        "politica", "politiche", "condizioni", "contratto", "contratti",
        "clausola", "clausole", "regolamento", "normativa", "normative",
        "inganno", "ingannevole", "truffa", "truffatori", "frode",
        "scorretto", "scorrettezza", "illecito", "trasparenza",
    },
    "external": {
        "branch", "branches", "office", "offices", "location", "locations",
        "employee", "employees", "staff", "personnel", "manager", "managers",
        "atm", "atms", "cashier", "teller", "counter", "physical",
        "in person", "in-person", "visit", "visited", "filiale", "filiali",
        "sede", "sedi", "ufficio", "uffici", "sportello", "sportelli",
        "dipendente", "dipendenti", "personale", "direttore", "direttori",
        "bancomat", "cassa", "cassiere", "consulente", "consulenti",
        "promotore", "promotori", "promotrice", "appuntamento",
    },
}

APP_RELATED_KEYWORDS = {
    "app", "application", "update", "updates", "updated", "version",
    "install", "installed", "download", "downloaded", "interface", "ui",
    "ux", "design", "screen", "screens", "button", "buttons", "menu",
    "navigation", "navigate", "loading", "load", "loads", "login",
    "log in", "logout", "sign in", "signin", "signup", "sign up",
    "crash", "crashes", "crashed", "crashing", "bug", "bugs", "buggy",
    "glitch", "glitches", "freeze", "freezes", "frozen", "slow",
    "fast", "speed", "performance", "lag", "laggy", "responsive",
    "notification", "notifications", "push", "alert", "alerts",
    "feature", "features", "function", "functions", "functionality",
    "fingerprint", "face id", "faceid", "biometric", "touch id",
    "widget", "widgets", "dark mode", "layout", "tab", "tabs",
    "scroll", "scrolling", "swipe", "tap", "click", "search",
    "filter", "sort", "display", "displaying", "shows", "showing",
    "applicazione", "aggiornamento", "aggiornamenti", "aggiornata",
    "versione", "installare", "installata", "scaricare", "scaricata",
    "interfaccia", "schermata", "schermate", "pulsante", "pulsanti",
    "navigazione", "caricamento", "accesso", "accedere", "registrazione",
    "blocca", "bloccata", "bloccato", "errore", "errori",
    "lento", "lenta", "veloce", "prestazioni", "notifica", "notifiche",
    "funzione", "funzioni", "funzionalità", "impronta", "riconoscimento",
}


def classify_review(title, review_text):
    text = f"{title} {review_text}".lower()
    words = set(re.findall(r"[a-zA-ZàèéìòùÀÈÉÌÒÙ'-]{3,}", text))

    non_app_scores = {}
    total_non_app = 0
    for category, kw_set in NON_APP_CATEGORIES.items():
        hits = words & kw_set
        for phrase in kw_set:
            if " " in phrase and phrase in text:
                hits.add(phrase)
        score = len(hits)
        non_app_scores[category] = score
        total_non_app += score

    app_hits = words & APP_RELATED_KEYWORDS
    for phrase in APP_RELATED_KEYWORDS:
        if " " in phrase and phrase in text:
            app_hits.add(phrase)
    app_score = len(app_hits)

    if total_non_app == 0 and app_score == 0:
        return "app_related", None
    if total_non_app == 0:
        return "app_related", None

    if app_score == 0 and total_non_app > 0:
        dominant = max(non_app_scores, key=non_app_scores.get)
        return "non_app", dominant

    if total_non_app > app_score * 1.5:
        dominant = max(non_app_scores, key=non_app_scores.get)
        return "non_app", dominant

    return "app_related", None


def add_classification_columns(df):
    classifications = df.apply(
        lambda r: classify_review(str(r.get("title", "")), str(r.get("review", ""))),
        axis=1,
    )
    df["is_app_related"] = classifications.apply(lambda x: x[0] == "app_related")
    df["exclusion_category"] = classifications.apply(lambda x: x[1])
    return df


def compute_adjusted_metrics(df):
    if df.empty:
        return {}

    if "is_app_related" not in df.columns:
        df = add_classification_columns(df)

    total = len(df)
    original_avg = df["rating"].mean()

    app_df = df[df["is_app_related"]].copy()
    excluded_df = df[~df["is_app_related"]].copy()

    app_count = len(app_df)
    excluded_count = len(excluded_df)
    adjusted_avg = app_df["rating"].mean() if not app_df.empty else 0

    category_breakdown = {}
    if not excluded_df.empty:
        for cat in NON_APP_CATEGORIES:
            cat_count = len(excluded_df[excluded_df["exclusion_category"] == cat])
            if cat_count > 0:
                category_breakdown[cat] = cat_count

    return {
        "original_count": total,
        "original_avg": round(original_avg, 2),
        "adjusted_count": app_count,
        "adjusted_avg": round(adjusted_avg, 2),
        "excluded_count": excluded_count,
        "excluded_pct": round(excluded_count / total * 100, 1) if total > 0 else 0,
        "rating_delta": round(adjusted_avg - original_avg, 2) if app_count > 0 else 0,
        "category_breakdown": category_breakdown,
    }


CATEGORY_LABELS = {
    "pricing": "💰 Pricing & Billing",
    "support": "📞 Customer Support",
    "policy": "📋 Policy & Terms",
    "external": "🏢 Branches & Staff",
}


def render_adjusted_rating_card(metrics):
    if not metrics:
        return

    st.subheader("Adjusted Rating — App Experience Only")
    st.caption(
        "Reviews about pricing, customer support, company policies, or physical locations "
        "are excluded to isolate feedback specifically about the app experience."
    )

    c1, c2, c3 = st.columns(3)
    c1.metric(
        "Original Rating",
        f"{metrics['original_avg']:.2f} ⭐",
        help=f"Based on all {metrics['original_count']} reviews",
    )
    delta_color = "normal" if metrics["rating_delta"] >= 0 else "inverse"
    c2.metric(
        "Adjusted Rating",
        f"{metrics['adjusted_avg']:.2f} ⭐",
        delta=f"{metrics['rating_delta']:+.2f}",
        delta_color=delta_color,
        help=f"Based on {metrics['adjusted_count']} app-related reviews",
    )
    c3.metric(
        "Excluded Reviews",
        f"{metrics['excluded_count']} ({metrics['excluded_pct']:.0f}%)",
        help="Reviews classified as not about the app experience itself",
    )

    if metrics["category_breakdown"]:
        st.markdown("**Excluded reviews by category:**")
        cat_cols = st.columns(len(metrics["category_breakdown"]))
        for i, (cat, count) in enumerate(sorted(metrics["category_breakdown"].items(), key=lambda x: -x[1])):
            label = CATEGORY_LABELS.get(cat, cat.title())
            cat_cols[i].metric(label, count)


def compute_sentiment(texts):
    pos_count = 0
    neg_count = 0
    total_words = 0
    for text in texts:
        words = re.findall(r"[a-zA-ZàèéìòùÀÈÉÌÒÙ]{3,}", text.lower())
        total_words += len(words)
        for w in words:
            if w in POSITIVE_WORDS:
                pos_count += 1
            elif w in NEGATIVE_WORDS:
                neg_count += 1

    sentiment_total = pos_count + neg_count
    if sentiment_total == 0:
        return {"score": 0.0, "label": "Neutral", "positive": 0, "negative": 0, "total_words": total_words}

    score = (pos_count - neg_count) / sentiment_total
    if score > 0.2:
        label = "Positive"
    elif score < -0.2:
        label = "Negative"
    else:
        label = "Mixed"

    return {
        "score": round(score, 2),
        "label": label,
        "positive": pos_count,
        "negative": neg_count,
        "total_words": total_words,
    }


def extract_keywords(texts, top_n=30):
    word_counts = Counter()
    for text in texts:
        words = re.findall(r"[a-zA-ZàèéìòùÀÈÉÌÒÙ]{3,}", text.lower())
        for w in words:
            if w not in STOP_WORDS:
                word_counts[w] += 1
    return word_counts.most_common(top_n)


def extract_bigrams(texts, top_n=20):
    bigram_counts = Counter()
    for text in texts:
        words = re.findall(r"[a-zA-ZàèéìòùÀÈÉÌÒÙ]{3,}", text.lower())
        words = [w for w in words if w not in STOP_WORDS]
        for i in range(len(words) - 1):
            bigram_counts[(words[i], words[i + 1])] += 1
    return bigram_counts.most_common(top_n)


def cluster_reviews_by_theme(reviews_df, rating_range, top_n=5):
    subset = reviews_df[reviews_df["rating"].between(rating_range[0], rating_range[1])].copy()
    if subset.empty:
        return []

    texts = (subset["title"].fillna("") + " " + subset["review"].fillna("")).tolist()
    bigrams = extract_bigrams(texts, top_n=50)
    keywords = extract_keywords(texts, top_n=50)

    bg_dict = {f"{a} {b}": c for (a, b), c in bigrams}

    themes = []
    used_reviews = set()

    top_phrases = list(bg_dict.items())[:top_n * 3]

    for phrase, phrase_count in top_phrases:
        if len(themes) >= top_n:
            break

        phrase_words = phrase.split()
        matching = subset[
            subset.apply(
                lambda r, pw=phrase_words: any(
                    w in (str(r["title"]).lower() + " " + str(r["review"]).lower())
                    for w in pw
                ),
                axis=1,
            )
        ]

        matching = matching[~matching.index.isin(used_reviews)]
        if matching.empty:
            continue

        best = matching.sort_values("date", ascending=False).iloc[0]
        used_reviews.add(best.name)

        related_words = []
        review_text = (str(best["title"]) + " " + str(best["review"])).lower()
        for kw, cnt in keywords:
            if kw in review_text and kw not in phrase_words and len(related_words) < 3:
                related_words.append(kw)

        all_matching_indices = list(matching.index)

        themes.append({
            "theme": phrase,
            "mentions": phrase_count,
            "example_title": best["title"],
            "example_review": best["review"],
            "example_rating": best["rating"],
            "example_date": best["date"].strftime("%Y-%m-%d") if best["date"] else "",
            "example_author": best["author"],
            "related_words": related_words,
            "all_matching_indices": all_matching_indices,
        })

    return themes


def render_themes_with_all_reviews(themes, source_df, section_key, is_problem=True):
    if not themes:
        if is_problem:
            st.success("No significant problems found in the reviews!")
        else:
            st.info("No strong positive themes found yet.")
        return

    for idx, theme in enumerate(themes, 1):
        with st.expander(
            f"**{idx}. \"{theme['theme']}\"** — mentioned {theme['mentions']} times",
            expanded=(idx <= 2),
        ):
            if theme["related_words"]:
                st.markdown(f"**Related topics:** {', '.join(theme['related_words'])}")

            st.markdown("**Example review:**")
            st.markdown(
                f"> **{theme['example_title']}** "
                f"({'⭐' * theme['example_rating']}) — {theme['example_date']}\n>\n"
                f"> {theme['example_review']}"
            )
            st.caption(f"— {theme['example_author']}")

            matching_indices = theme.get("all_matching_indices", [])
            if len(matching_indices) > 1:
                with st.expander(f"View all {len(matching_indices)} matching reviews"):
                    all_matching = source_df.loc[
                        source_df.index.isin(matching_indices)
                    ].sort_values("date", ascending=False)
                    display_df = all_matching[["date", "rating", "title", "review", "author"]].copy()
                    display_df["date"] = display_df["date"].dt.strftime("%Y-%m-%d")
                    st.dataframe(display_df, width="stretch", height=300, hide_index=True)


def render_insights_section(data_df, section_key):
    total = len(data_df)
    avg_rating = data_df["rating"].mean()
    negative_pct = len(data_df[data_df["rating"] <= 2]) / total * 100
    positive_pct = len(data_df[data_df["rating"] >= 4]) / total * 100

    all_texts = (data_df["title"].fillna("") + " " + data_df["review"].fillna("")).tolist()
    sentiment = compute_sentiment(all_texts)

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Average Rating", f"{avg_rating:.1f} ⭐")
    m2.metric("Positive (4-5⭐)", f"{positive_pct:.0f}%")
    m3.metric("Negative (1-2⭐)", f"{negative_pct:.0f}%")

    sentiment_emoji = {"Positive": "😊", "Negative": "😟", "Mixed": "😐", "Neutral": "😶"}
    m4.metric(
        "Sentiment",
        f"{sentiment_emoji.get(sentiment['label'], '')} {sentiment['label']}",
        help=f"Score: {sentiment['score']} (positive words: {sentiment['positive']}, negative words: {sentiment['negative']})",
    )

    st.divider()

    classified_df = add_classification_columns(data_df.copy())
    adj_metrics = compute_adjusted_metrics(classified_df)
    render_adjusted_rating_card(adj_metrics)

    if adj_metrics.get("excluded_count", 0) > 0:
        with st.expander(f"View {adj_metrics['excluded_count']} excluded (non-app) reviews"):
            excluded = classified_df[~classified_df["is_app_related"]].sort_values("date", ascending=False)
            exc_display = excluded[["date", "rating", "title", "review", "author", "exclusion_category"]].copy()
            exc_display["date"] = exc_display["date"].dt.strftime("%Y-%m-%d")
            exc_display.columns = ["Date", "Rating", "Title", "Review", "Author", "Category"]
            exc_display["Category"] = exc_display["Category"].map(
                lambda c: CATEGORY_LABELS.get(c, c.title() if c else "")
            )
            st.dataframe(exc_display, width="stretch", height=300, hide_index=True)

    st.divider()

    st.subheader("Sentiment Breakdown")
    st.caption("Analysis of positive and negative language used across all reviews.")

    sent_col1, sent_col2, sent_col3 = st.columns(3)
    sent_col1.metric("Positive Words Found", sentiment["positive"])
    sent_col2.metric("Negative Words Found", sentiment["negative"])
    score_display = f"{sentiment['score']:+.2f}"
    sent_col3.metric("Sentiment Score", score_display, help="Range: -1.0 (very negative) to +1.0 (very positive)")

    sent_chart_data = pd.DataFrame({
        "Type": ["Positive", "Negative"],
        "Count": [sentiment["positive"], sentiment["negative"]],
    })
    st.bar_chart(sent_chart_data, x="Type", y="Count")

    st.divider()

    st.subheader("Top 5 Problems")
    st.caption("The most common complaints and pain points users mention in negative reviews (1-2 stars).")
    problems = cluster_reviews_by_theme(data_df, (1, 2), top_n=5)
    render_themes_with_all_reviews(problems, data_df, section_key, is_problem=True)

    st.divider()

    st.subheader("Top 5 Wins")
    st.caption("What users love most, based on positive reviews (4-5 stars).")
    wins = cluster_reviews_by_theme(data_df, (4, 5), top_n=5)
    render_themes_with_all_reviews(wins, data_df, section_key, is_problem=False)


def render_empty_state(icon, title, description):
    st.markdown(f"""
    <div class="empty-state">
        <div class="empty-icon">{icon}</div>
        <div class="empty-title">{title}</div>
        <div class="empty-desc">{description}</div>
    </div>
    """, unsafe_allow_html=True)


# ─── SIDEBAR ───
with st.sidebar:
    st.image("static/logo.png", width=120)

    st.markdown("## App Store")
    country_code = st.text_input("Country", value="it", help="Two-letter country code (e.g. 'it' for Italy, 'us' for USA)")

    search_query = st.text_input("Search App", value="", placeholder="e.g. WhatsApp, Instagram...", key="app_search_input")

    if "selected_app" not in st.session_state:
        st.session_state.selected_app = None

    if "last_search" not in st.session_state:
        st.session_state.last_search = ""

    if search_query.strip():
        if search_query.strip() != st.session_state.last_search:
            st.session_state.last_search = search_query.strip()
            st.session_state.selected_app = None

        if search_query.strip().isdigit():
            st.session_state.selected_app = {"id": search_query.strip(), "name": f"App {search_query.strip()}", "developer": "", "icon": "", "rating": 0, "ratings_count": 0}
        else:
            results = search_apps(search_query.strip(), country=country_code.strip() or "us", limit=10)
            if results:
                sel = st.session_state.selected_app
                scroll_container = st.container(height=340)
                with scroll_container:
                    for i, r in enumerate(results):
                        is_sel = sel and sel.get("id") == r["id"]
                        stars_val = round(r.get("rating", 0))
                        stars_str = "★" * stars_val + "☆" * (5 - stars_val) if stars_val else ""
                        icon_url = r.get("icon", "")
                        check = "✓ " if is_sel else ""
                        icol, bcol = st.columns([0.18, 0.82], vertical_alignment="center")
                        with icol:
                            if icon_url:
                                st.markdown(
                                    f'<img src="{icon_url}" style="width:28px;height:28px;border-radius:7px;">',
                                    unsafe_allow_html=True,
                                )
                        with bcol:
                            label = f"{check}{r['name']}"
                            if st.button(label, key=f"pick_{i}", use_container_width=True, type="secondary"):
                                st.session_state.selected_app = r
                                st.rerun()
                            st.markdown(
                                f'<p style="font-size:8px;color:#86868b;margin:-10px 0 4px 0;letter-spacing:1px;'
                                f'padding-left:14px;">{stars_str}</p>',
                                unsafe_allow_html=True,
                            )
            else:
                st.caption("No apps found.")
                st.session_state.selected_app = None
    else:
        st.session_state.selected_app = None
        st.session_state.last_search = ""

    app_id = st.session_state.selected_app["id"] if st.session_state.selected_app else ""

    st.markdown("## Fetch Mode")
    fetch_mode = st.radio("Fetch by", ["Time period", "Pages"], horizontal=True, key="fetch_mode", label_visibility="collapsed")

    if fetch_mode == "Time period":
        use_precision = st.checkbox("Precision dates", value=False, key="use_precision_dates")
        if use_precision:
            date_col1, date_col2 = st.columns(2)
            with date_col1:
                from_date = st.date_input("From", value=datetime.now().date() - timedelta(days=365), key="from_date")
            with date_col2:
                to_date = st.date_input("To", value=datetime.now().date(), key="to_date")
            if to_date < from_date:
                st.warning("'To' date is before 'From' date — swapping them.")
                from_date, to_date = to_date, from_date
            time_days = (to_date - from_date).days
            cutoff_date_val = datetime(from_date.year, from_date.month, from_date.day, tzinfo=timezone.utc)
            end_date_val = datetime(to_date.year, to_date.month, to_date.day, 23, 59, 59, tzinfo=timezone.utc)
        else:
            months_val = st.slider("Months back", min_value=1, max_value=24, value=12, step=1, key="months_slider")
            time_days = months_val * 30
            cutoff_date_val = None
            end_date_val = None
        max_pages = 50
    else:
        max_pages = st.number_input("Pages to fetch", min_value=1, max_value=50, value=10, key="max_pages_input",
                                    help="Each page contains ~50 reviews from the RSS feed.")
        time_days = 365 * 10
        cutoff_date_val = None
        end_date_val = None

    fetch_button = st.button("Fetch Reviews", type="primary", disabled=not app_id.strip())

    st.markdown("---")

# ─── SEGMENTED CONTROL ───
if "active_section" not in st.session_state:
    st.session_state.active_section = "App Store"

seg_cols = st.columns(3)
for i, label in enumerate(["App Store", "Trustpilot", "Comparison"]):
    with seg_cols[i]:
        is_active = st.session_state.active_section == label
        if is_active:
            st.markdown(
                f'<div style="background:rgba(0,0,0,0.06);border-radius:980px;padding:10px 24px;'
                f'text-align:center;font-family:Inter,-apple-system,sans-serif;font-size:14px;'
                f'font-weight:600;color:#1D1D1F;letter-spacing:-0.01em;cursor:default;">{label}</div>',
                unsafe_allow_html=True,
            )
        else:
            if st.button(label, key=f"seg_{label}", type="secondary", use_container_width=True):
                st.session_state.active_section = label
                st.rerun()

st.markdown("")

# ─── APP STORE FETCH ───
if fetch_button:
    if not app_id.strip():
        st.error("Please search and select an app first.")
    else:
        if cutoff_date_val:
            cutoff_date = cutoff_date_val
        else:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=time_days)

        progress_bar = st.progress(0, text="Starting App Store fetch...")
        status_text = st.empty()

        reviews = fetch_reviews(
            app_id.strip(), country_code.strip(), max_pages,
            cutoff_date, progress_bar, status_text,
        )

        if not reviews:
            st.warning("No App Store reviews found for this app/country/time combination.")
            st.session_state.reviews_df = None
            st.session_state.fetch_done = True
        else:
            app_df = pd.DataFrame(reviews)
            app_df = app_df.sort_values("date", ascending=False).reset_index(drop=True)
            if end_date_val is not None:
                app_df = app_df[app_df["date"] <= end_date_val].reset_index(drop=True)
            st.session_state.reviews_df = app_df
            st.session_state.fetch_done = True
            progress_bar.empty()
            status_text.empty()
            st.rerun()

df = st.session_state.reviews_df
active = st.session_state.active_section

# ═══════════════════════════════════════
# SECTION: App Store (Reviews + Insights)
# ═══════════════════════════════════════
if active == "App Store":
    if df is None or df.empty:
        if st.session_state.fetch_done:
            render_empty_state("🔍", "No reviews found", "Try adjusting your App ID, country, or time range in the sidebar.")
        else:
            render_empty_state("📱", "No results yet", "Search for an app in the sidebar and click Fetch Reviews to get started.")
    else:
        total = len(df)
        avg = df["rating"].mean()

        st.markdown(f"### Overall Score: {'⭐' * round(avg)} **{avg:.1f}** / 5")
        st.caption(f"Based on **{total}** reviews")

        col1, col2, col3, col4, col5 = st.columns(5)
        for i, col in enumerate([col1, col2, col3, col4, col5], start=1):
            count = len(df[df["rating"] == i])
            pct = count / total * 100 if total > 0 else 0
            col.metric(f"{'⭐' * i}", f"{count} ({pct:.0f}%)")

        st.divider()

        st.subheader("Rating Distribution")
        rating_counts = df["rating"].value_counts().sort_index()
        chart_df = pd.DataFrame({
            "Rating": [f"{'⭐' * i}" for i in rating_counts.index],
            "Count": rating_counts.values,
        })
        st.bar_chart(chart_df, x="Rating", y="Count")

        st.divider()

        st.subheader("Drilldown by Rating")
        selected_rating = st.selectbox(
            "Select a rating to explore",
            options=[5, 4, 3, 2, 1],
            format_func=lambda x: f"{'⭐' * x} ({len(df[df['rating'] == x])} reviews)",
        )

        drilldown = df[df["rating"] == selected_rating].copy()
        if drilldown.empty:
            st.info(f"No {'⭐' * selected_rating} reviews.")
        else:
            dd_avg_len = drilldown["review"].str.len().mean()
            dd_versions = drilldown["version"].value_counts().head(3)

            dc1, dc2, dc3 = st.columns(3)
            dc1.metric(f"{'⭐' * selected_rating} Reviews", len(drilldown))
            dc2.metric("Avg Review Length", f"{dd_avg_len:.0f} chars")
            top_ver = dd_versions.index[0] if not dd_versions.empty else "N/A"
            dc3.metric("Top Version", top_ver)

            drilldown_display = drilldown[["date", "title", "review", "author", "version"]].copy()
            drilldown_display["date"] = drilldown_display["date"].dt.strftime("%Y-%m-%d")
            st.dataframe(drilldown_display, width="stretch", height=350)

        st.divider()

        st.subheader("All Reviews")
        filter_cols = st.columns([2, 2])
        with filter_cols[0]:
            rating_filter = st.multiselect("Filter by rating", [1, 2, 3, 4, 5], default=[1, 2, 3, 4, 5])
        with filter_cols[1]:
            sort_order = st.selectbox("Sort by date", ["Newest first", "Oldest first"])

        filtered = df[df["rating"].isin(rating_filter)].copy()
        filtered = filtered.sort_values("date", ascending=(sort_order == "Oldest first")).reset_index(drop=True)

        preview = filtered.copy()
        preview["date"] = preview["date"].dt.strftime("%Y-%m-%d")
        st.dataframe(preview, width="stretch", height=400)

        st.divider()
        excel_data = create_excel(filtered)
        st.download_button(
            label="Download Reviews (Excel)",
            data=excel_data,
            file_name="app_reviews.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            type="primary",
        )

        # ─── Insights sub-section (same page) ───
        st.divider()
        st.markdown("### Insights")

        render_insights_section(df, "appstore_insights")

        st.divider()

        st.subheader("Version Insights")
        st.caption("How ratings and review volume vary across app versions.")
        ver_df = df[df["version"] != "N/A"].copy()
        if ver_df.empty:
            st.info("No version information available in reviews.")
        else:
            ver_stats = ver_df.groupby("version").agg(
                reviews=("rating", "size"),
                avg_rating=("rating", "mean"),
                earliest=("date", "min"),
            ).reset_index()
            ver_stats = ver_stats.sort_values("earliest")
            ver_stats = ver_stats[ver_stats["reviews"] >= 2]

            if ver_stats.empty:
                st.info("Not enough reviews per version to generate a meaningful chart.")
            else:
                top_versions = ver_stats.tail(15)
                chart_versions = top_versions.copy()
                chart_versions["avg_rating"] = chart_versions["avg_rating"].round(2)

                st.markdown("**Average Rating by Version**")
                rating_chart = pd.DataFrame({
                    "Version": chart_versions["version"].values,
                    "Avg Rating": chart_versions["avg_rating"].values,
                })
                st.bar_chart(rating_chart, x="Version", y="Avg Rating")

                st.markdown("**Number of Reviews by Version**")
                count_chart = pd.DataFrame({
                    "Version": chart_versions["version"].values,
                    "Reviews": chart_versions["reviews"].values,
                })
                st.bar_chart(count_chart, x="Version", y="Reviews")

                st.markdown("**Details**")
                display_stats = top_versions[["version", "reviews", "avg_rating"]].copy()
                display_stats.columns = ["Version", "Reviews", "Avg Rating"]
                display_stats["Avg Rating"] = display_stats["Avg Rating"].round(2)
                st.dataframe(display_stats, width="stretch", hide_index=True)


# ═══════════════════════════
# SECTION: Trustpilot
# ═══════════════════════════
elif active == "Trustpilot":
    st.markdown("### Trustpilot Reviews")
    st.caption("Fetch and analyze reviews from Trustpilot. Independent from App Store data.")

    tp_col1, tp_col2, tp_col3 = st.columns([3, 2, 2])
    with tp_col1:
        trustpilot_domain = st.text_input(
            "Trustpilot Domain",
            value="",
            placeholder="e.g. bancobpm.it",
            help="The company domain as shown on Trustpilot (it.trustpilot.com/review/DOMAIN)",
            key="tp_domain_input",
        )
    with tp_col2:
        tp_months = st.slider("Months back", min_value=1, max_value=24, value=12, step=1, key="tp_months")
        tp_time_days = tp_months * 30
    with tp_col3:
        tp_max_pages = st.number_input(
            "Max pages",
            min_value=1,
            max_value=50,
            value=10,
            key="tp_max_pages",
            help="Each page contains ~20 reviews.",
        )

    tp_fetch = st.button("Fetch Trustpilot Reviews", type="primary", disabled=not trustpilot_domain.strip(), key="tp_fetch_btn")

    if tp_fetch and trustpilot_domain.strip():
        tp_cutoff = datetime.now(timezone.utc) - timedelta(days=tp_time_days)

        tp_progress = st.progress(0, text="Starting Trustpilot fetch...")
        tp_status = st.empty()
        tp_debug = st.empty()

        domain_clean = _clean_trustpilot_domain(trustpilot_domain)
        tp_debug.info(f"Fetching from: trustpilot.com/review/{domain_clean}")

        tp_reviews, tp_info = fetch_trustpilot_reviews(
            domain_clean, tp_max_pages, tp_cutoff,
            tp_progress, tp_status,
        )

        st.session_state.trustpilot_info = tp_info
        tp_progress.empty()
        tp_debug.empty()

        if not tp_reviews:
            if tp_info:
                st.warning(f"Connected to Trustpilot ({tp_info['name']}, {tp_info['totalReviews']} total reviews) but no reviews matched. Try increasing the time range.")
            else:
                st.error("Could not connect to Trustpilot. Check the domain and try again.")
            st.session_state.trustpilot_df = None
            st.session_state.tp_fetch_done = True
        else:
            tp_df = pd.DataFrame(tp_reviews)
            tp_df = tp_df.sort_values("date", ascending=False).reset_index(drop=True)
            st.session_state.trustpilot_df = tp_df
            st.session_state.tp_fetch_done = True
            tp_status.empty()
            st.rerun()

    st.divider()

    tp_df = st.session_state.trustpilot_df
    tp_info = st.session_state.trustpilot_info

    if tp_df is None or (hasattr(tp_df, 'empty') and tp_df.empty):
        if st.session_state.tp_fetch_done:
            render_empty_state("🔍", "No Trustpilot reviews found", "Check the domain name and try again with a wider time range.")
        else:
            render_empty_state("💬", "No Trustpilot data yet", "Enter a domain above and click Fetch Trustpilot Reviews to get started.")
    else:
        if tp_info:
            st.markdown(f"### {tp_info['name']} on Trustpilot")
            tp_m1, tp_m2, tp_m3 = st.columns(3)
            tp_m1.metric("TrustScore", f"{tp_info['trustScore']:.1f} / 5")
            tp_m2.metric("Stars", f"{'⭐' * round(tp_info['stars'])}")
            tp_m3.metric("Total Reviews (all time)", tp_info['totalReviews'])

        st.caption(f"Showing **{len(tp_df)}** reviews within the selected time period")

        st.divider()
        render_insights_section(tp_df, "trustpilot_insights")

        st.divider()

        st.subheader("All Trustpilot Reviews")
        tp_filter_cols = st.columns([2, 2])
        with tp_filter_cols[0]:
            tp_rating_filter = st.multiselect("Filter by rating", [1, 2, 3, 4, 5], default=[1, 2, 3, 4, 5], key="tp_rating_filter")
        with tp_filter_cols[1]:
            tp_sort_order = st.selectbox("Sort by date", ["Newest first", "Oldest first"], key="tp_sort")

        tp_filtered = tp_df[tp_df["rating"].isin(tp_rating_filter)].copy()
        tp_filtered = tp_filtered.sort_values("date", ascending=(tp_sort_order == "Oldest first")).reset_index(drop=True)

        tp_preview = tp_filtered[["date", "rating", "title", "review", "author"]].copy()
        tp_preview["date"] = tp_preview["date"].dt.strftime("%Y-%m-%d")
        st.dataframe(tp_preview, width="stretch", height=400)

        st.divider()
        tp_excel = create_excel(tp_filtered)
        st.download_button(
            label="Download Trustpilot reviews (Excel)",
            data=tp_excel,
            file_name="trustpilot_reviews.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            type="primary",
            key="tp_download",
        )


# ═══════════════════════════
# SECTION: Comparison
# ═══════════════════════════
elif active == "Comparison":
    st.markdown("### Compare Multiple Apps")
    st.caption(
        "Enter App Store IDs of apps you want to compare. "
        "You can find the ID in any App Store URL: apps.apple.com/.../id**284882215**"
    )

    comp_country = st.text_input(
        "Country code for comparison",
        value=country_code,
        key="comp_country",
        help="Same country code used for all apps in the comparison",
    )

    comp_months = st.slider("Months back", min_value=1, max_value=24, value=12, step=1, key="comp_months")
    comp_days = comp_months * 30

    comp_pages = st.number_input(
        "Max pages per app",
        min_value=1,
        max_value=50,
        value=10,
        key="comp_pages",
        help="Fetching stops at page limit OR time period — whichever comes first",
    )

    st.subheader("Apps to Compare")

    if "comp_apps" not in st.session_state:
        if st.session_state.selected_app:
            st.session_state.comp_apps = [st.session_state.selected_app.copy(), None]
        else:
            st.session_state.comp_apps = [None, None]
    elif st.session_state.comp_apps and st.session_state.comp_apps[0] is None and st.session_state.selected_app:
        st.session_state.comp_apps[0] = st.session_state.selected_app.copy()

    apps_to_remove = None
    for idx in range(len(st.session_state.comp_apps)):
        current = st.session_state.comp_apps[idx]
        label = f"App {idx + 1}"
        if current:
            icon_h = f'<img src="{current["icon"]}" style="width:20px;height:20px;border-radius:5px;margin-right:6px;vertical-align:middle;">' if current.get("icon") else ""
            st.markdown(
                f'<div style="background:var(--secondary-bg);border-radius:10px;padding:8px 12px;margin:4px 0;display:flex;align-items:center;">'
                f'{icon_h}<span style="font-size:13px;font-weight:600;">{current["name"]}</span>'
                f'<span style="font-size:11px;color:var(--text-secondary);margin-left:6px;">({current["id"]})</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
            c_clear, c_rm = st.columns([1, 1])
            with c_clear:
                if st.button("Change", key=f"comp_clear_{idx}"):
                    st.session_state.comp_apps[idx] = None
                    st.rerun()
            with c_rm:
                if len(st.session_state.comp_apps) > 2:
                    if st.button("Remove", key=f"remove_{idx}"):
                        apps_to_remove = idx
        else:
            comp_search = st.text_input(label, value="", placeholder="Search app name...", key=f"comp_search_{idx}")
            if comp_search.strip():
                if comp_search.strip().isdigit():
                    st.session_state.comp_apps[idx] = {"id": comp_search.strip(), "name": f"App {comp_search.strip()}", "developer": "", "icon": "", "rating": 0, "ratings_count": 0}
                    st.rerun()
                else:
                    comp_results = search_apps(comp_search.strip(), country=comp_country.strip() or "us", limit=5)
                    if comp_results:
                        comp_options = {f"{r['name']}  —  {r['developer']}": r for r in comp_results}
                        comp_selected = st.selectbox(
                            f"Select App {idx + 1}",
                            options=list(comp_options.keys()),
                            key=f"comp_select_{idx}",
                            label_visibility="collapsed",
                        )
                        if comp_selected and st.button("Confirm", key=f"comp_confirm_{idx}"):
                            st.session_state.comp_apps[idx] = comp_options[comp_selected]
                            st.rerun()
                    else:
                        st.caption("No apps found.")
            if not current and len(st.session_state.comp_apps) > 2:
                if st.button("Remove", key=f"remove_empty_{idx}"):
                    apps_to_remove = idx

    if apps_to_remove is not None:
        st.session_state.comp_apps.pop(apps_to_remove)
        st.rerun()

    bc1, bc2 = st.columns([1, 3])
    with bc1:
        if st.button("+ Add App", key="add_app"):
            if len(st.session_state.comp_apps) < 10:
                st.session_state.comp_apps.append(None)
                st.rerun()

    valid_ids = [a["id"] for a in st.session_state.comp_apps if a is not None]

    with bc2:
        compare_button = st.button(
            "Compare Apps",
            type="primary",
            disabled=len(valid_ids) < 2,
            key="compare_btn",
        )

    if compare_button and len(valid_ids) >= 2:
        cutoff = datetime.now(timezone.utc) - timedelta(days=comp_days)
        comp_data = {}
        app_names = {}

        progress = st.progress(0, text="Starting comparison...")
        status = st.empty()

        for i, aid in enumerate(valid_ids):
            progress.progress((i) / len(valid_ids), text=f"Looking up app {aid}...")
            name = lookup_app_name(aid, comp_country)
            app_names[aid] = name
            status.text(f"Fetching reviews for {name} ({aid})...")
            progress.progress((i + 0.3) / len(valid_ids), text=f"Fetching {name}...")

            reviews = fetch_reviews_simple(aid, comp_country, comp_pages, cutoff)
            if reviews:
                comp_df = pd.DataFrame(reviews)
                comp_df = comp_df.sort_values("date", ascending=False).reset_index(drop=True)
                comp_data[aid] = comp_df
            else:
                comp_data[aid] = pd.DataFrame(columns=["date", "rating", "title", "review", "author", "version"])

            status.text(f"{name}: {len(reviews)} reviews found")

        progress.progress(1.0, text="Done!")
        st.session_state.comp_data = comp_data
        st.session_state.comp_names = app_names
        st.session_state.comp_fetched = True
        progress.empty()
        status.empty()
        st.rerun()

    if st.session_state.comp_fetched and st.session_state.comp_data:
        comp_data = st.session_state.comp_data
        app_names = st.session_state.get("comp_names", {})

        st.divider()

        st.subheader("Score Overview")

        summary_rows = []
        for aid, cdf in comp_data.items():
            name = app_names.get(aid, aid)
            total = len(cdf)
            texts = (cdf["title"].fillna("") + " " + cdf["review"].fillna("")).tolist() if total > 0 else []
            sent = compute_sentiment(texts)
            adj = compute_adjusted_metrics(cdf) if total > 0 else {}
            if total > 0:
                avg = cdf["rating"].mean()
                pos = len(cdf[cdf["rating"] >= 4]) / total * 100
                neg = len(cdf[cdf["rating"] <= 2]) / total * 100
            else:
                avg = pos = neg = 0

            r1 = len(cdf[cdf["rating"] == 1]) if total > 0 else 0
            r2 = len(cdf[cdf["rating"] == 2]) if total > 0 else 0
            r3 = len(cdf[cdf["rating"] == 3]) if total > 0 else 0
            r4 = len(cdf[cdf["rating"] == 4]) if total > 0 else 0
            r5 = len(cdf[cdf["rating"] == 5]) if total > 0 else 0

            summary_rows.append({
                "App": name,
                "ID": aid,
                "Reviews": total,
                "Avg Rating": round(avg, 1),
                "Adj. Rating": adj.get("adjusted_avg", "—"),
                "Δ Rating": f"{adj.get('rating_delta', 0):+.2f}" if adj else "—",
                "Excluded": f"{adj.get('excluded_count', 0)} ({adj.get('excluded_pct', 0):.0f}%)" if adj else "—",
                "Sentiment": f"{sent['label']} ({sent['score']:+.2f})",
                "Positive %": f"{pos:.0f}%",
                "Negative %": f"{neg:.0f}%",
                "1s": r1, "2s": r2, "3s": r3, "4s": r4, "5s": r5,
            })

        summary_df = pd.DataFrame(summary_rows)
        st.dataframe(summary_df, width="stretch", hide_index=True)

        st.divider()

        st.subheader("Sentiment Comparison")
        sent_rows = []
        for aid, cdf in comp_data.items():
            name = app_names.get(aid, aid)
            total = len(cdf)
            if total > 0:
                texts = (cdf["title"].fillna("") + " " + cdf["review"].fillna("")).tolist()
                sent = compute_sentiment(texts)
                sent_rows.append({
                    "App": name,
                    "Positive Words": sent["positive"],
                    "Negative Words": sent["negative"],
                    "Score": sent["score"],
                })

        if sent_rows:
            sent_df = pd.DataFrame(sent_rows)
            st.dataframe(sent_df, width="stretch", hide_index=True)

            score_chart = pd.DataFrame({
                "App": [r["App"] for r in sent_rows],
                "Sentiment Score": [r["Score"] for r in sent_rows],
            })
            st.bar_chart(score_chart, x="App", y="Sentiment Score")

        st.divider()

        st.subheader("Rating Distribution Comparison")
        chart_rows = []
        for aid, cdf in comp_data.items():
            name = app_names.get(aid, aid)
            total = len(cdf)
            if total > 0:
                for r in range(1, 6):
                    count = len(cdf[cdf["rating"] == r])
                    chart_rows.append({
                        "App": name,
                        "Rating": f"{r} star",
                        "Percentage": count / total * 100,
                    })

        if chart_rows:
            chart_data = pd.DataFrame(chart_rows)
            pivot = chart_data.pivot(index="Rating", columns="App", values="Percentage").fillna(0)
            st.bar_chart(pivot)

        st.divider()

        st.subheader("Head-to-Head: Problems & Wins")

        app_list = [(aid, app_names.get(aid, aid)) for aid in comp_data if not comp_data[aid].empty]

        if len(app_list) >= 2:
            cols = st.columns(len(app_list))
            for col_idx, (aid, name) in enumerate(app_list):
                cdf = comp_data[aid]
                with cols[col_idx]:
                    st.markdown(f"#### {name}")
                    avg = cdf["rating"].mean()
                    st.markdown(f"**{avg:.1f}** / 5 ({len(cdf)} reviews)")

                    st.markdown("---")
                    st.markdown("**Top Problems**")
                    problems = cluster_reviews_by_theme(cdf, (1, 2), top_n=3)
                    if not problems:
                        st.caption("No major problems found")
                    else:
                        for p in problems:
                            with st.expander(f"\"{p['theme']}\" ({p['mentions']}x)"):
                                st.markdown(
                                    f"> {p['example_review'][:200]}{'...' if len(p['example_review']) > 200 else ''}"
                                )

                    st.markdown("**Top Wins**")
                    wins = cluster_reviews_by_theme(cdf, (4, 5), top_n=3)
                    if not wins:
                        st.caption("No strong wins found")
                    else:
                        for w in wins:
                            with st.expander(f"\"{w['theme']}\" ({w['mentions']}x)"):
                                st.markdown(
                                    f"> {w['example_review'][:200]}{'...' if len(w['example_review']) > 200 else ''}"
                                )
        else:
            st.info("Need at least 2 apps with reviews for head-to-head comparison.")

        st.divider()

        st.subheader("Download Comparison Data")
        if comp_data:
            comp_excel = create_comparison_excel(comp_data, app_names)
            st.download_button(
                label="Download all reviews (Excel)",
                data=comp_excel,
                file_name="comparison_reviews.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                type="primary",
                key="download_comparison",
            )
    elif not st.session_state.comp_fetched:
        render_empty_state("📊", "No comparison data yet", "Enter at least 2 App Store IDs above and click Compare Apps to get started.")
