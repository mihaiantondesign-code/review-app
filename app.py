import streamlit as st
import requests
import pandas as pd
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from io import BytesIO

st.set_page_config(page_title="App Store Reviews Exporter", page_icon="📱", layout="wide")

if "reviews_df" not in st.session_state:
    st.session_state.reviews_df = None
if "fetch_done" not in st.session_state:
    st.session_state.fetch_done = False


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


def fetch_reviews(app_id, country, max_pages, cutoff_date, fetch_mode, progress_bar, status_text):
    all_reviews = []
    hard_limit = 50

    for page in range(1, (max_pages if fetch_mode == "By number of pages" else hard_limit) + 1):
        display_max = max_pages if fetch_mode == "By number of pages" else hard_limit
        progress_bar.progress(page / display_max, text=f"Fetching page {page}...")
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
            status_text.text(f"No more entries at page {page}. Stopping.")
            break

        review_entries = entries[1:] if page == 1 else entries

        if not review_entries:
            status_text.text(f"No review entries on page {page}. Stopping.")
            break

        page_count = 0
        all_too_old = True
        for entry in review_entries:
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

    kw_dict = dict(keywords)
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
                lambda r: any(
                    w in (str(r["title"]).lower() + " " + str(r["review"]).lower())
                    for w in phrase_words
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

        themes.append({
            "theme": phrase,
            "mentions": phrase_count,
            "example_title": best["title"],
            "example_review": best["review"],
            "example_rating": best["rating"],
            "example_date": best["date"].strftime("%Y-%m-%d") if best["date"] else "",
            "example_author": best["author"],
            "related_words": related_words,
        })

    return themes


with st.sidebar:
    st.header("Configuration")
    app_id = st.text_input("App Store App ID", value="", placeholder="e.g. 284882215")
    country_code = st.text_input("Country Code", value="it", help="Two-letter country code (e.g. 'it' for Italy, 'us' for USA)")

    st.subheader("Fetch Mode")
    fetch_mode = st.radio("How to limit fetching", ["By number of pages", "By time period"], horizontal=True)

    if fetch_mode == "By number of pages":
        max_pages = st.number_input("Max Pages to Fetch", min_value=1, max_value=50, value=10)
        time_days = 365
    else:
        time_period = st.select_slider(
            "Time period",
            options=["1 month", "3 months", "6 months", "1 year"],
            value="1 year",
        )
        period_map = {"1 month": 30, "3 months": 90, "6 months": 180, "1 year": 365}
        time_days = period_map[time_period]
        max_pages = 50

    output_filename = st.text_input("Output Filename", value="app_reviews.xlsx")
    if not output_filename.endswith(".xlsx"):
        output_filename += ".xlsx"
    fetch_button = st.button("Fetch Reviews", type="primary", disabled=not app_id.strip())

tabs = st.tabs(["📋 Reviews", "💡 Insights"])

if fetch_button:
    if not app_id.strip():
        st.error("Please enter a valid App Store App ID.")
    else:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=time_days)
        with tabs[0]:
            progress_bar = st.progress(0, text="Starting...")
            status_text = st.empty()

            reviews = fetch_reviews(
                app_id.strip(), country_code.strip(), max_pages,
                cutoff_date, fetch_mode, progress_bar, status_text,
            )

            if not reviews:
                st.warning("No reviews found for this app/country/time combination.")
                st.session_state.reviews_df = None
                st.session_state.fetch_done = True
            else:
                df = pd.DataFrame(reviews)
                df = df.sort_values("date", ascending=False).reset_index(drop=True)
                st.session_state.reviews_df = df
                st.session_state.fetch_done = True
                progress_bar.empty()
                status_text.empty()
                st.rerun()

df = st.session_state.reviews_df

with tabs[0]:
    if df is None or df.empty:
        if st.session_state.fetch_done:
            st.info("No reviews were found. Try adjusting your settings in the sidebar.")
        else:
            st.info("Configure your App ID and settings in the sidebar, then click **Fetch Reviews** to get started.")
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
            st.dataframe(drilldown_display, use_container_width=True, height=350)

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
        st.dataframe(preview, use_container_width=True, height=400)

        st.divider()
        excel_data = create_excel(filtered)
        st.download_button(
            label=f"Download {output_filename}",
            data=excel_data,
            file_name=output_filename,
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            type="primary",
        )

with tabs[1]:
    if df is None or df.empty:
        if st.session_state.fetch_done:
            st.info("No reviews to analyze. Try adjusting your settings.")
        else:
            st.info("Fetch reviews first using the sidebar to see insights here.")
    else:
        total = len(df)
        avg_rating = df["rating"].mean()
        negative_pct = len(df[df["rating"] <= 2]) / total * 100
        positive_pct = len(df[df["rating"] >= 4]) / total * 100

        m1, m2, m3 = st.columns(3)
        m1.metric("Average Rating", f"{avg_rating:.1f} ⭐")
        m2.metric("Positive (4-5⭐)", f"{positive_pct:.0f}%")
        m3.metric("Negative (1-2⭐)", f"{negative_pct:.0f}%")

        st.divider()

        st.subheader("🔴 Top 5 Problems")
        st.caption("The most common complaints and pain points users mention in negative reviews (1-2 stars).")

        problems = cluster_reviews_by_theme(df, (1, 2), top_n=5)
        if not problems:
            st.success("No significant problems found in the reviews!")
        else:
            for idx, problem in enumerate(problems, 1):
                with st.expander(
                    f"**{idx}. \"{problem['theme']}\"** — mentioned {problem['mentions']} times",
                    expanded=(idx <= 2),
                ):
                    if problem["related_words"]:
                        st.markdown(f"**Related topics:** {', '.join(problem['related_words'])}")

                    st.markdown("**Example review:**")
                    st.markdown(
                        f"> **{problem['example_title']}** "
                        f"({'⭐' * problem['example_rating']}) — {problem['example_date']}\n>\n"
                        f"> {problem['example_review']}"
                    )
                    st.caption(f"— {problem['example_author']}")

        st.divider()

        st.subheader("🟢 Top 5 Wins")
        st.caption("What users love most about the app, based on positive reviews (4-5 stars).")

        wins = cluster_reviews_by_theme(df, (4, 5), top_n=5)
        if not wins:
            st.info("No strong positive themes found yet.")
        else:
            for idx, win in enumerate(wins, 1):
                with st.expander(
                    f"**{idx}. \"{win['theme']}\"** — mentioned {win['mentions']} times",
                    expanded=(idx <= 2),
                ):
                    if win["related_words"]:
                        st.markdown(f"**Related topics:** {', '.join(win['related_words'])}")

                    st.markdown("**Example review:**")
                    st.markdown(
                        f"> **{win['example_title']}** "
                        f"({'⭐' * win['example_rating']}) — {win['example_date']}\n>\n"
                        f"> {win['example_review']}"
                    )
                    st.caption(f"— {win['example_author']}")

        st.divider()

        st.subheader("Version Comparison")
        st.caption("How ratings vary across app versions.")
        ver_df = df[df["version"] != "N/A"]
        if ver_df.empty:
            st.info("No version information available in reviews.")
        else:
            ver_stats = ver_df.groupby("version").agg(
                reviews=("rating", "size"),
                avg_rating=("rating", "mean"),
            ).reset_index()
            ver_stats.columns = ["Version", "Reviews", "Avg Rating"]
            ver_stats["Avg Rating"] = ver_stats["Avg Rating"].round(2)
            ver_stats = ver_stats.sort_values("Reviews", ascending=False).head(15)
            st.dataframe(ver_stats, use_container_width=True, hide_index=True)
