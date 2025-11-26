// Auto-generate cache name based on build time
const CACHE_NAME = `scoolynk-cache-${self.__BUILD_ID__ || 'v3.0.0'}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event — cache all core files and skip waiting
self.addEventListener('install', event => {
  console.log('[SW] Installing new service worker...', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Skip waiting - activating immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event — cleanup old caches and take control immediately
self.addEventListener('activate', event => {
  console.log('[SW] Activating new service worker...', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming all clients');
      return self.clients.claim();
    })
  );
});

// Fetch event — NETWORK-FIRST for HTML/API, cache-first for static assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) return;

  // NETWORK-FIRST for HTML pages and API calls
  if (
    request.headers.get('accept')?.includes('text/html') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('render.com') // Your backend API
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(error => {
          console.log('[SW] Network failed, serving from cache:', request.url);
          // Fallback to cache if offline
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If it's a navigation request and nothing in cache, return index.html
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            throw error;
          });
        })
    );
    return;
  }

  // CACHE-FIRST for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version but update cache in background
          fetch(request).then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {
            // Network failed, but we have cache so it's fine
          });
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then(networkResponse => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});