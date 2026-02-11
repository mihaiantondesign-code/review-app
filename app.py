import streamlit as st
import requests
import pandas as pd
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from io import BytesIO

st.set_page_config(page_title="App Store Reviews Exporter", page_icon="📱", layout="wide")

for key, default in [
    ("reviews_df", None),
    ("fetch_done", False),
    ("comp_apps", []),
    ("comp_data", {}),
    ("comp_fetched", False),
]:
    if key not in st.session_state:
        st.session_state[key] = default


def build_url(country, app_id, page=1):
    base = f"https://itunes.apple.com/{country}/rss/customerreviews/id={app_id}/sortBy=mostRecent/json"
    if page > 1:
        base += f"/page={page}"
    return base


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

        review_entries = entries[1:] if page == 1 else entries
        if not review_entries:
            break

        all_too_old = True
        for entry in review_entries:
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

    st.subheader("Fetch Limits")
    time_period = st.select_slider(
        "Time period",
        options=["1 month", "3 months", "6 months", "1 year"],
        value="1 year",
    )
    period_map = {"1 month": 30, "3 months": 90, "6 months": 180, "1 year": 365}
    time_days = period_map[time_period]

    max_pages = st.number_input("Max Pages to Fetch", min_value=1, max_value=50, value=10,
                                help="Fetching stops when all pages are fetched OR all reviews are older than the time period — whichever comes first.")

    output_filename = st.text_input("Output Filename", value="app_reviews.xlsx")
    if not output_filename.endswith(".xlsx"):
        output_filename += ".xlsx"
    fetch_button = st.button("Fetch Reviews", type="primary", disabled=not app_id.strip())

tabs = st.tabs(["📋 Reviews", "💡 Insights", "⚔️ Comparison"])

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
                cutoff_date, progress_bar, status_text,
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

        all_texts = (df["title"].fillna("") + " " + df["review"].fillna("")).tolist()
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
                st.dataframe(display_stats, use_container_width=True, hide_index=True)

with tabs[2]:
    st.markdown("### Compare Multiple Apps")
    st.caption(
        "Enter App Store IDs of apps you want to compare. "
        "You can find the ID in any App Store URL: `apps.apple.com/.../id**284882215**`"
    )

    comp_country = st.text_input(
        "Country code for comparison",
        value=country_code,
        key="comp_country",
        help="Same country code used for all apps in the comparison",
    )

    comp_time = st.select_slider(
        "Time period for comparison",
        options=["1 month", "3 months", "6 months", "1 year"],
        value="1 year",
        key="comp_time",
    )
    comp_period_map = {"1 month": 30, "3 months": 90, "6 months": 180, "1 year": 365}
    comp_days = comp_period_map[comp_time]

    comp_pages = st.number_input(
        "Max pages per app",
        min_value=1,
        max_value=50,
        value=10,
        key="comp_pages",
        help="Fetching stops at page limit OR time period — whichever comes first",
    )

    st.subheader("Apps to Compare")

    if "comp_app_ids" not in st.session_state:
        st.session_state.comp_app_ids = ["", ""]

    apps_to_remove = None
    for idx in range(len(st.session_state.comp_app_ids)):
        c1, c2 = st.columns([5, 1])
        with c1:
            st.session_state.comp_app_ids[idx] = st.text_input(
                f"App {idx + 1}",
                value=st.session_state.comp_app_ids[idx],
                key=f"comp_app_{idx}",
                placeholder="Enter App Store ID",
            )
        with c2:
            if len(st.session_state.comp_app_ids) > 2:
                if st.button("Remove", key=f"remove_{idx}"):
                    apps_to_remove = idx

    if apps_to_remove is not None:
        st.session_state.comp_app_ids.pop(apps_to_remove)
        st.rerun()

    bc1, bc2 = st.columns([1, 3])
    with bc1:
        if st.button("+ Add App", key="add_app"):
            if len(st.session_state.comp_app_ids) < 10:
                st.session_state.comp_app_ids.append("")
                st.rerun()

    valid_ids = [aid.strip() for aid in st.session_state.comp_app_ids if aid.strip()]

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
                "Sentiment": f"{sent['label']} ({sent['score']:+.2f})",
                "Positive %": f"{pos:.0f}%",
                "Negative %": f"{neg:.0f}%",
                "⭐": r1,
                "⭐⭐": r2,
                "⭐⭐⭐": r3,
                "⭐⭐⭐⭐": r4,
                "⭐⭐⭐⭐⭐": r5,
            })

        summary_df = pd.DataFrame(summary_rows)
        st.dataframe(summary_df, use_container_width=True, hide_index=True)

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
            st.dataframe(sent_df, use_container_width=True, hide_index=True)

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
                        "Rating": f"{r}⭐",
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
                    st.markdown(f"**{avg:.1f}** ⭐ ({len(cdf)} reviews)")

                    st.markdown("---")
                    st.markdown("**🔴 Top Problems**")
                    problems = cluster_reviews_by_theme(cdf, (1, 2), top_n=3)
                    if not problems:
                        st.caption("No major problems found")
                    else:
                        for p in problems:
                            with st.expander(f"\"{p['theme']}\" ({p['mentions']}x)"):
                                st.markdown(
                                    f"> {p['example_review'][:200]}{'...' if len(p['example_review']) > 200 else ''}"
                                )

                    st.markdown("**🟢 Top Wins**")
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
        st.info("Enter at least 2 App IDs above and click **Compare Apps** to get started.")
