const CACHE_NAME = 'dkpp-pwa-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.webmanifest',
    '/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install event: cache initial static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Cache addAll failed during install:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event: Network-first with cache fallback
self.addEventListener('fetch', (event) => {
    // Only handle GET requests and http/https schemes
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // Skip Inertia / API requests from aggressive caching to avoid stale dynamic data
    const isNavigation = event.request.mode === 'navigate';
    const isStaticAsset = event.request.url.includes('/build/') || 
                          event.request.url.includes('/icons/') || 
                          event.request.url.endsWith('.png') || 
                          event.request.url.endsWith('.jpg') || 
                          event.request.url.endsWith('.svg') || 
                          event.request.url.endsWith('.css') || 
                          event.request.url.endsWith('.js');

    if (isStaticAsset) {
        // Cache-first for immutable build/static assets
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    if (isNavigation) {
        // Network first for page navigation, fallback to cache
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return caches.match('/');
                });
            })
        );
        return;
    }

    // Default network pass-through
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

