"""
Valeriy-Dev Automation — contact form backend.

FastAPI service that:
  * accepts contact-form submissions from the static site,
  * validates + rate-limits per IP,
  * persists submissions to SQLite,
  * forwards a formatted notification to a Telegram chat via Bot API.

Run locally:
    uvicorn backend.main:app --reload --port 8000

Environment variables (see .env.example):
    TELEGRAM_BOT_TOKEN   — bot token from @BotFather
    TELEGRAM_CHAT_ID     — numeric chat id (user or channel)
    ALLOWED_ORIGINS      — comma-separated list, e.g. https://valeriy-dev.xyz
    DB_PATH              — optional, default ./data/submissions.db
    RATE_LIMIT_PER_HOUR  — optional, default 5
"""

from __future__ import annotations

import logging
import os
import re
import sqlite3
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

import httpx
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

log = logging.getLogger("valeriy-dev.contact")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s :: %(message)s")

# -- config ---------------------------------------------------------------
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "").strip()
ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080,https://valeriy-dev.xyz"
).split(",") if o.strip()]
DB_PATH = Path(os.getenv("DB_PATH", "./data/submissions.db"))
RATE_LIMIT_PER_HOUR = int(os.getenv("RATE_LIMIT_PER_HOUR", "5"))

# -- storage --------------------------------------------------------------
def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _init_db() -> None:
    with _connect() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS submissions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at  TEXT    NOT NULL,
                ip          TEXT    NOT NULL,
                name        TEXT    NOT NULL,
                email       TEXT    NOT NULL,
                message     TEXT    NOT NULL,
                delivered   INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        c.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON submissions(created_at)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_ip ON submissions(ip)")
        c.commit()


# -- rate limit -----------------------------------------------------------
def _ip_submission_count(ip: str, within_seconds: int = 3600) -> int:
    since = time.time() - within_seconds
    since_iso = datetime.fromtimestamp(since, tz=timezone.utc).isoformat()
    with _connect() as c:
        row = c.execute(
            "SELECT COUNT(*) FROM submissions WHERE ip = ? AND created_at >= ?",
            (ip, since_iso),
        ).fetchone()
    return int(row[0]) if row else 0


# -- telegram -------------------------------------------------------------
TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


async def _notify_telegram(payload: "ContactIn", ip: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        log.warning("telegram disabled: missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID")
        return False

    text = (
        "🛰️ *New contact submission*\n"
        f"*Name:* {payload.name}\n"
        f"*Email:* `{payload.email}`\n"
        f"*IP:* `{ip}`\n"
        f"*Message:*\n{payload.message}"
    )
    try:
        async with httpx.AsyncClient(timeout=10) as http:
            res = await http.post(
                TELEGRAM_API.format(token=TELEGRAM_BOT_TOKEN),
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": text,
                    "parse_mode": "Markdown",
                    "disable_web_page_preview": True,
                },
            )
        if res.status_code >= 400:
            log.error("telegram send failed: %s %s", res.status_code, res.text)
            return False
        return True
    except httpx.HTTPError as exc:  # pragma: no cover
        log.exception("telegram request error: %s", exc)
        return False


# -- schemas --------------------------------------------------------------
class ContactIn(BaseModel):
    name: Annotated[str, Field(min_length=2, max_length=120)]
    email: EmailStr
    message: Annotated[str, Field(min_length=5, max_length=5000)]
    # honeypot: must stay empty
    _gotcha: str | None = Field(default=None, alias="_gotcha")


class ContactOut(BaseModel):
    ok: bool
    id: int | None = None
    delivered: bool = False


# -- lifespan -------------------------------------------------------------
@asynccontextmanager
async def lifespan(_: FastAPI):
    _init_db()
    log.info("db ready at %s ; telegram=%s", DB_PATH, bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID))
    yield


# -- app ------------------------------------------------------------------
app = FastAPI(
    title="Valeriy-Dev Automation — Contact API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
    max_age=600,
)


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}


_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@app.post("/api/contact", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
async def submit_contact(payload: ContactIn, request: Request) -> ContactOut:
    # honeypot
    gotcha = (payload.model_dump().get("_gotcha") or "").strip()
    if gotcha:
        # Pretend success to confuse bots, but don't store or notify.
        return ContactOut(ok=True, delivered=False)

    # basic sanity (pydantic already did most)
    if not _EMAIL_RE.match(payload.email):
        raise HTTPException(status_code=422, detail="Invalid email")

    client_ip = (request.headers.get("x-forwarded-for") or request.client.host or "0.0.0.0").split(",")[0].strip()

    # rate limit
    if _ip_submission_count(client_ip) >= RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {RATE_LIMIT_PER_HOUR}/hour per IP.",
        )

    created_at = datetime.now(timezone.utc).isoformat()

    with _connect() as c:
        cur = c.execute(
            "INSERT INTO submissions (created_at, ip, name, email, message) VALUES (?, ?, ?, ?, ?)",
            (created_at, client_ip, payload.name.strip(), payload.email.lower(), payload.message.strip()),
        )
        submission_id = cur.lastrowid
        c.commit()

    delivered = await _notify_telegram(payload, client_ip)

    if delivered:
        with _connect() as c:
            c.execute("UPDATE submissions SET delivered = 1 WHERE id = ?", (submission_id,))
            c.commit()

    log.info("submission id=%s delivered=%s ip=%s", submission_id, delivered, client_ip)
    return ContactOut(ok=True, id=submission_id, delivered=delivered)
