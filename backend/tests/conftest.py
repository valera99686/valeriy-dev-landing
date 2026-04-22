"""Shared pytest fixtures."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def tmp_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Isolated SQLite DB per test."""
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DB_PATH", str(db_path))
    # no telegram by default
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.delenv("TELEGRAM_CHAT_ID", raising=False)
    monkeypatch.setenv("RATE_LIMIT_PER_HOUR", "5")
    return db_path


@pytest.fixture
def client(tmp_db: Path):
    """FastAPI test client with isolated DB."""
    # Reload module so env vars are re-read.
    import importlib
    import sys

    sys.modules.pop("main", None)
    main = importlib.import_module("main")
    with TestClient(main.app) as c:
        yield c


@pytest.fixture
def sample_payload() -> dict:
    return {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "message": "We need a Telegram bot integrated with our CRM.",
    }
