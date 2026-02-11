import streamlit as st
import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
from io import BytesIO

st.set_page_config(page_title="App Store Reviews Exporter", page_icon="📱", layout="wide")

st.title("📱 App Store Reviews Exporter")
st.markdown("Fetch Apple App Store reviews via the public RSS feed and export them to Excel.")

with st.sidebar:
    st.header("Configuration")
    app_id = st.text_input("App Store App ID", value="", placeholder="e.g. 284882215")
    country_code = st.text_input("Country Code", value="it", help="Two-letter country code (e.g. 'it' for Italy, 'us' for USA)")
    max_pages = st.number_input("Max Pages to Fetch", min_value=1, max_value=50, value=10)
    output_filename = st.text_input("Output Filename", value="app_reviews.xlsx")
    if not output_filename.endswith(".xlsx"):
        output_filename += ".xlsx"
    fetch_button = st.button("Fetch Reviews", type="primary", disabled=not app_id.strip())


def build_url(country, app_id, page=1):
    base = f"https://itunes.apple.com/{country}/rss/customerreviews/id={app_id}/sortBy=mostRecent/json"
    if page > 1:
        base += f"/page={page}"
    return base


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


def fetch_reviews(app_id, country, max_pages, progress_bar, status_text):
    all_reviews = []
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=365)

    for page in range(1, max_pages + 1):
        progress_bar.progress(page / max_pages, text=f"Fetching page {page}/{max_pages}...")
        status_text.text(f"Fetching page {page}...")

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
            status_text.text(f"No more entries found at page {page}. Stopping.")
            break

        review_entries = entries[1:] if page == 1 else entries

        if not review_entries:
            status_text.text(f"No review entries on page {page}. Stopping.")
            break

        page_count = 0
        for entry in review_entries:
            parsed = parse_entry(entry)
            if parsed and parsed["date"] and parsed["rating"]:
                if parsed["date"] >= cutoff_date:
                    all_reviews.append(parsed)
                    page_count += 1

        status_text.text(f"Page {page}: found {page_count} recent reviews")

        if page_count == 0:
            status_text.text(f"No recent reviews on page {page}. Stopping.")
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


if fetch_button:
    if not app_id.strip():
        st.error("Please enter a valid App Store App ID.")
    else:
        st.divider()
        progress_bar = st.progress(0, text="Starting...")
        status_text = st.empty()

        reviews = fetch_reviews(app_id.strip(), country_code.strip(), max_pages, progress_bar, status_text)

        if not reviews:
            st.warning("No reviews found in the last 365 days for this app/country combination.")
        else:
            df = pd.DataFrame(reviews)
            df = df.sort_values("date", ascending=False).reset_index(drop=True)

            st.success(f"Found **{len(df)}** reviews from the last 365 days.")

            col1, col2, col3, col4, col5 = st.columns(5)
            for i, col in enumerate([col1, col2, col3, col4, col5], start=1):
                count = len(df[df["rating"] == i])
                col.metric(f"{'⭐' * i}", count)

            st.subheader("Reviews Preview")
            preview_df = df.copy()
            preview_df["date"] = preview_df["date"].dt.strftime("%Y-%m-%d")
            st.dataframe(preview_df, use_container_width=True, height=400)

            excel_data = create_excel(df)

            st.download_button(
                label=f"Download {output_filename}",
                data=excel_data,
                file_name=output_filename,
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                type="primary",
            )

            status_text.text(f"Ready! {len(df)} reviews available for download as {output_filename}")
