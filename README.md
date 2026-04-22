# Valeriy-Dev Automation — Corporate Website

Static, dark-themed, fully-responsive B2B corporate site for **Valeriy-Dev Automation**. Built with vanilla HTML5 / CSS3 / JavaScript — no build step, no framework, zero dependencies.

Designed to pass verification on grant programs and cloud platforms (e.g. AWS Activate), and to serve as the public front for our automation, Telegram-bot, and LLM-integration services.

---

## ✨ Features

- Single-page landing with anchor navigation (Services · Process · Tech Stack · Engagement · FAQ · Contact)
- Dark mode with neon cyan / violet accents, Inter + JetBrains Mono typography
- Animated particle-network hero canvas (pauses when tab hidden, respects `prefers-reduced-motion`)
- Typed-phrase hero headline, scroll-progress bar, animated stat counters, back-to-top button
- Services grid with hover spotlight, tech-stack tag clouds, syntax-highlighted code snippet
- Multi-page site: `product.html` (Vega pitch), `pricing.html` (3 plans + comparison table + pricing FAQ), `about.html` (mission, 5-step timeline, founder card, company facts)
- Process timeline (4 steps), engagement models (Pilot / Project / Retainer), FAQ accordion
- "Built with" partners strip on home (Python, AWS, Claude, Telegram, FastAPI, Docker, Postgres)
- **Product codename: `Vega`** — global rename is a single search/replace across `product.html`, `pricing.html`, `about.html` if you choose a different name
- Accessible contact form with client-side validation, Formspree integration + `mailto:` fallback, honeypot anti-spam
- SEO: meta tags, Open Graph + custom SVG OG image, Twitter card, JSON-LD (`Organization`, `WebSite`, `FAQPage`), `sitemap.xml`, `robots.txt`
- PWA manifest (`manifest.webmanifest`), custom `404.html`
- Security hardening: `Content-Security-Policy`, HSTS, `X-Frame-Options`, `Permissions-Policy` (Netlify `_headers` + `netlify.toml`)
- GitHub Actions workflow for auto-deploy to GitHub Pages
- Legal stubs: `terms.html`, `privacy.html`
- Mobile hamburger nav, AA color contrast, skip-link, focus styles, MIT license

## 📁 Structure

```
.
├── index.html              # Main landing page
├── product.html            # Vega product page
├── pricing.html            # Pricing plans + comparison + FAQ
├── about.html              # Mission, timeline, founder, company facts
├── terms.html              # Terms of Service
├── privacy.html            # Privacy Policy
├── robots.txt
├── sitemap.xml
├── README.md
└── assets/
    ├── favicon.svg
    ├── css/styles.css
    └── js/
        ├── main.js         # Nav, form, reveal animations
        └── hero-canvas.js  # Particle-network animation
```

## 🚀 Local preview

No build required. Open `index.html` directly, or serve the folder:

```powershell
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

## 📬 Contact form setup (Formspree)

The form currently points at a placeholder endpoint. While the endpoint contains the literal string `FORMSPREE_ENDPOINT`, the form gracefully falls back to opening the user's mail client (`mailto:admin@valeriy-dev.xyz`).

To enable real delivery:

1. Create a free account at [formspree.io](https://formspree.io) and a new form.
2. Copy the form's hashed ID (e.g. `xyzabc12`).
3. In `index.html`, replace `FORMSPREE_ENDPOINT` inside the form's `action` attribute:

```html
<form ... action="https://formspree.io/f/xyzabc12" method="POST">
```

That's it — the JS in `assets/js/main.js` auto-detects a real endpoint and switches to AJAX submission.

## ☁️ Deployment

### Option A — Netlify (drag & drop)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the project folder onto the page.
3. Netlify assigns a URL + free auto-SSL.
4. (Optional) Add custom domain `valeriy-dev.xyz` in Site settings → Domain management and follow the DNS instructions.

### Option B — GitHub Pages
1. Create a public repo and push the files to `main`.
2. Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. GitHub serves the site at `https://<user>.github.io/<repo>/` with free SSL.
4. For a custom domain, add a `CNAME` file with `valeriy-dev.xyz` and configure DNS (`A` records to GH Pages IPs or `CNAME` for subdomain).

### Option C — Vercel
1. `npm i -g vercel` then `vercel` in the folder. Accept defaults (it detects the static site).
2. Add custom domain in the Vercel dashboard.

## 🔒 Security / HTTPS

All three hosts above provision a free TLS certificate automatically. Always serve the site over HTTPS.

## 🧭 Customisation notes

- Colors: tweak CSS variables at the top of `assets/css/styles.css` (`--accent`, `--accent-2`, `--bg`, …).
- Company copy: update hero, services, tech tags directly in `index.html`.
- Canvas density / speed: see `CFG` object in `assets/js/hero-canvas.js`.
- Email address is referenced in: `index.html`, `terms.html`, `privacy.html`, `assets/js/main.js`, JSON-LD block.

## � Optional self-hosted backend (`backend/`)

A production-ready **FastAPI** service that accepts contact-form submissions, persists them to SQLite, and forwards formatted notifications to a Telegram chat. See `backend/README.md` for details.

```bash
cd backend
cp .env.example .env       # TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ALLOWED_ORIGINS
docker compose up -d --build
```

Point the frontend at it by changing the form's `action` in `index.html`:

```html
<form ... action="https://api.valeriy-dev.xyz/api/contact" method="POST">
```

The client auto-detects a non-Formspree endpoint and sends `application/json`. The CSP in `_headers` already whitelists `https://api.valeriy-dev.xyz`.

## 🧪 Tests & CI

- **Playwright** smoke tests (`tests/smoke.spec.js`) cover navigation, sections, FAQ accordion, form validation, legal pages, and 404 behaviour.
- **Lighthouse CI** asserts Performance / A11y / Best-Practices / SEO ≥ 0.9 on the home + legal pages.
- GitHub Actions (`.github/workflows/ci.yml`) runs both on every push.

```powershell
npm install
npm run test:install
npm test
```

## 📱 Offline / PWA

`sw.js` is a service worker that precaches the app shell and uses stale-while-revalidate for static assets + network-first for HTML. Registered automatically over HTTPS. `manifest.webmanifest` + `theme-color` meta make the site installable.

## 🗺️ Reference architecture

The Tech Stack section contains an inline SVG diagram of the canonical deployment we ship: Client → API Gateway → Python Agent (FastAPI on Lambda / Fargate) → Claude / Bedrock, backed by Postgres / S3 and CloudWatch.

## �📝 Status

Valeriy-Dev Automation is currently operating in an active R&D phase, building scalable cloud infrastructure for upcoming product releases.

## © License

© 2026 Valeriy-Dev Automation. All rights reserved.
