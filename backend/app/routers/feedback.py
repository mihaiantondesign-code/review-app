import os
import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8591602091:AAEQ3vqYSrqyyVLJxKyXiNhBbZZdBZafFf0")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "148844183")


class FeedbackPayload(BaseModel):
    comment: str = ""


@router.post("")
async def submit_feedback(payload: FeedbackPayload):
    if not payload.comment.strip():
        return {"ok": True}

    text = f"💡 Feature request\n\n{payload.comment.strip()}"

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": text})

    return {"ok": True}
