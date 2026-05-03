// HerrGYM Service Worker — v1.0
const CACHE_NAME = 'herrgym-v1';

// Əsas resurslar — bunlar həmişə cache-lənir
const PRECACHE_ASSETS = [
  './index.html',
  './manifest.json',
];

// ── INSTALL ──────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH — Cache First, fallback Network ────────────────────────────
self.addEventListener('fetch', event => {
  // Yalnız GET sorğularına cavab ver
  if (event.request.method !== 'GET') return;

  // Google Fonts və xarici CDN — Network First
  const url = event.request.url;
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        fetch(event.request)
          .then(response => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => caches.match(event.request))
      )
    );
    return;
  }

  // Əsas resurslar — Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Yalnız uğurlu cavabları cache-lə
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Offline olduqda index.html qaytar
        return caches.match('./index.html');
      });
    })
  );
});
