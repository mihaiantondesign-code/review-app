import re
import pandas as pd
from io import BytesIO


def create_excel(reviews: list[dict]) -> bytes:
    df = pd.DataFrame(reviews)
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        for rating in range(1, 6):
            sheet_name = f"{rating}_stelle"
            rating_df = df[df["rating"] == rating].copy()
            if not rating_df.empty and "date" in rating_df.columns:
                try:
                    rating_df["date"] = pd.to_datetime(rating_df["date"]).dt.strftime("%Y-%m-%d %H:%M")
                except Exception:
                    pass
            rating_df.to_excel(writer, sheet_name=sheet_name, index=False)
    output.seek(0)
    return output.getvalue()


def create_comparison_excel(apps: dict[str, list[dict]], app_names: dict[str, str]) -> bytes:
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        for app_id, reviews in apps.items():
            name = app_names.get(app_id, app_id)
            sheet_name = re.sub(r'[\\/*?:\[\]]', '', name)[:31]
            df = pd.DataFrame(reviews)
            if not df.empty and "date" in df.columns:
                try:
                    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d %H:%M")
                except Exception:
                    pass
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    output.seek(0)
    return output.getvalue()
