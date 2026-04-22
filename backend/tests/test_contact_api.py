"""Integration tests for the /api/contact endpoint."""

from __future__ import annotations

import sqlite3

import pytest
import respx
from httpx import Response


def test_healthz(client):
    res = client.get("/healthz")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert "ts" in body


def test_submit_valid_without_telegram(client, sample_payload, tmp_db):
    res = client.post("/api/contact", json=sample_payload)
    assert res.status_code == 201
    body = res.json()
    assert body["ok"] is True
    assert body["id"] is not None
    assert body["delivered"] is False  # no telegram configured

    # persisted
    with sqlite3.connect(tmp_db) as c:
        row = c.execute("SELECT name, email, delivered FROM submissions WHERE id = ?", (body["id"],)).fetchone()
    assert row[0] == "Jane Doe"
    assert row[1] == "jane@example.com"
    assert row[2] == 0


def test_submit_rejects_invalid_email(client, sample_payload):
    sample_payload["email"] = "not-an-email"
    res = client.post("/api/contact", json=sample_payload)
    assert res.status_code == 422


def test_submit_rejects_short_message(client, sample_payload):
    sample_payload["message"] = "hi"
    res = client.post("/api/contact", json=sample_payload)
    assert res.status_code == 422


def test_honeypot_drops_submission(client, sample_payload, tmp_db):
    payload = {**sample_payload, "_gotcha": "i-am-a-bot"}
    res = client.post("/api/contact", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["ok"] is True
    assert body["id"] is None
    assert body["delivered"] is False

    # nothing persisted
    with sqlite3.connect(tmp_db) as c:
        count = c.execute("SELECT COUNT(*) FROM submissions").fetchone()[0]
    assert count == 0


def test_rate_limit_per_ip(client, sample_payload):
    for _ in range(5):
        res = client.post("/api/contact", json=sample_payload)
        assert res.status_code == 201
    res = client.post("/api/contact", json=sample_payload)
    assert res.status_code == 429
    assert "Rate limit" in res.json()["detail"]


@pytest.fixture
def telegram_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "test-token-123")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")


def test_telegram_notification(client, sample_payload, telegram_env, tmp_db):
    with respx.mock(base_url="https://api.telegram.org") as rx:
        rx.post("/bottest-token-123/sendMessage").mock(
            return_value=Response(200, json={"ok": True, "result": {"message_id": 1}})
        )
        res = client.post("/api/contact", json=sample_payload)
    assert res.status_code == 201
    body = res.json()
    assert body["delivered"] is True

    with sqlite3.connect(tmp_db) as c:
        row = c.execute("SELECT delivered FROM submissions WHERE id = ?", (body["id"],)).fetchone()
    assert row[0] == 1


def test_telegram_failure_still_persists(client, sample_payload, telegram_env, tmp_db):
    with respx.mock(base_url="https://api.telegram.org") as rx:
        rx.post("/bottest-token-123/sendMessage").mock(
            return_value=Response(500, text="internal")
        )
        res = client.post("/api/contact", json=sample_payload)
    assert res.status_code == 201
    body = res.json()
    assert body["delivered"] is False

    with sqlite3.connect(tmp_db) as c:
        row = c.execute("SELECT delivered FROM submissions WHERE id = ?", (body["id"],)).fetchone()
    assert row[0] == 0
