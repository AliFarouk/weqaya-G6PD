// Weqaya G6PD Service Worker
const CACHE_NAME = 'weqaya-shell-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/site.webmanifest',
  '/favicon.svg',
  '/brand/logo-emblem.svg',
  '/brand/badge-food.svg',
  '/brand/badge-medication.svg',
  '/brand/hero-decor-b.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do not cache API routes, votes, or mutations
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first with cache fallback for HTML pages
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((res) => {
          return res || caches.match('/');
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for static brand assets
  if (url.pathname.startsWith('/brand/') || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
        return cached || fetchPromise;
      })
    );
  }
});
