const CACHE_NAME = 'saans-cache-v1';
const API_CACHE_NAME = 'saans-api-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/data/actions.json',
  '/data/demo_snapshot.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching some assets failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Cache API responses for offline (app shell and last plan)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/plan')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              const cacheKey = new Request(event.request.url, { method: 'GET' });
              cache.put(cacheKey, cloned).catch((err) => console.warn('Cache put failed:', err));
            });
          }
          return response;
        })
        .catch(() => {
          const cacheKey = new Request(event.request.url, { method: 'GET' });
          return caches.match(cacheKey).then((cached) => cached || caches.match(event.request));
        })
    );
    return;
  }

  // Network first with cache fallback for HTML navigation, cache first for static
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request) || caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          return response;
        })
      );
    })
  );
});
