# Contact API — Valeriy-Dev Automation

FastAPI micro-service that accepts contact-form submissions from the marketing site, persists them to SQLite, and forwards a formatted notification to a Telegram chat.

## Endpoints

- `GET  /healthz`       — liveness probe (`{ok: true}`).
- `POST /api/contact`   — accept submission (`name`, `email`, `message`, optional honeypot `_gotcha`). Returns `{ok, id, delivered}`.
- `GET  /docs`          — OpenAPI Swagger UI.

## Quick start

```bash
cp .env.example .env            # fill in Telegram token + chat id
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Docker

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost:8000/healthz
```

The SQLite database is persisted to `./data/submissions.db` via a bind-mount.

## Frontend wiring

Replace the `action` attribute of the contact form in `../index.html`:

```html
<form ... action="https://api.valeriy-dev.xyz/api/contact" method="POST">
```

The JS in `../assets/js/main.js` auto-detects a non-Formspree endpoint and will `fetch()` a JSON response.

## Security notes

- Honeypot field (`_gotcha`) silently drops bot traffic.
- Per-IP rate limit (default 5/hour) via SQLite count.
- CORS allowlist via `ALLOWED_ORIGINS`.
- Runs as non-root user in Docker.
- Deploy behind a TLS reverse-proxy (Caddy / nginx / ALB) — the app reads `X-Forwarded-For`.

## Deployment targets

- **AWS EC2 + Caddy** — single-box, auto-HTTPS.
- **AWS Lambda + API Gateway** — adapt with `mangum` (not included; trivial to add).
- **Fly.io / Render / Railway** — `docker compose` works as-is.
