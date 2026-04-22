/* Valeriy-Dev Automation — Service Worker
   Strategy:
     - precache the app shell on install
     - stale-while-revalidate for same-origin static assets
     - network-first for HTML navigation (with offline fallback)
*/
const VERSION = 'v1.1.0';
const CACHE_STATIC = `vd-static-${VERSION}`;
const CACHE_RUNTIME = `vd-runtime-${VERSION}`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/product.html',
  '/pricing.html',
  '/about.html',
  '/terms.html',
  '/privacy.html',
  '/404.html',
  '/assets/css/styles.css',
  '/assets/js/main.js',
  '/assets/js/hero-canvas.js',
  '/assets/favicon.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => ![CACHE_STATIC, CACHE_RUNTIME].includes(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // skip cross-origin (fonts, formspree) — let network handle with no caching here
  if (url.origin !== self.location.origin) return;

  // HTML navigation: network-first, fall back to cached /index.html or /404.html
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_RUNTIME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (_e) {
        const cached = await caches.match(req);
        return cached || caches.match('/index.html') || caches.match('/404.html');
      }
    })());
    return;
  }

  // Static: stale-while-revalidate
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const fetchPromise = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_RUNTIME).then((c) => c.put(req, clone));
      }
      return res;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
