// QuickFix Service Worker
const CACHE_NAME = 'quickfix-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/offline.html',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(PRECACHE_ASSETS);
            // Force waiting service worker to become active
            await self.skipWaiting();
        })()
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
            // Take control of all clients immediately
            await self.clients.claim();
        })()
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // For navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    // Try network first
                    const networkResponse = await fetch(event.request);
                    return networkResponse;
                } catch (error) {
                    // Network failed, try cache
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(event.request);

                    // Return cached response or offline page
                    return cachedResponse || cache.match(OFFLINE_URL);
                }
            })()
        );
        return;
    }

    // For other requests (images, API calls, etc.)
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            try {
                // Try network first
                const networkResponse = await fetch(event.request);

                // Cache successful responses
                if (networkResponse && networkResponse.status === 200) {
                    cache.put(event.request, networkResponse.clone());
                }

                return networkResponse;
            } catch (error) {
                // Network failed, try cache
                const cachedResponse = await cache.match(event.request);
                return cachedResponse || new Response('Network error', {
                    status: 408,
                    headers: { 'Content-Type': 'text/plain' },
                });
            }
        })()
    );
});

// Handle messages from client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
