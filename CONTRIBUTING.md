# Contributing

Thanks for considering a contribution. This repo is small and opinionated — please open an issue before non-trivial PRs.

## Ground rules

- Keep the site **framework-free** (vanilla HTML/CSS/JS). No runtime dependencies in the frontend.
- Keep the backend a single FastAPI app. No ORMs, no Celery, no Django — it must stay under ~250 lines.
- Keep the page load budget: **< 60 KB** compressed for all same-origin assets combined on the landing page.

## Local setup

```powershell
# Frontend
python -m http.server 8080

# Backend
cd backend
python -m venv .venv ; .\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn main:app --reload --port 8000
pytest
```

## Tests

- **Frontend**: Playwright — `npm test`.
- **Backend**: pytest — `cd backend && pytest`.
- **Lighthouse**: `lhci autorun` (CI runs this on every push).

## Commits

Conventional Commits are preferred:

```
feat(hero): add three.js progressive upgrade
fix(form): broaden endpoint detection
chore(ci): bump playwright
```

## Security

Please do not file public issues for security findings. Email `admin@valeriy-dev.xyz` directly; see `.well-known/security.txt`.
