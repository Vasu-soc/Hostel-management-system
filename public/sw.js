// Service Worker for HosteliHub - Offline Home Page Support
const CACHE_NAME = 'hostelihub-cache-v1';
const STATIC_CACHE = 'hostelihub-static-v1';

// Assets to cache immediately for offline home page
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Pre-caching static assets');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // 2. Skip development-only and internal requests
  if (
    url.pathname.startsWith('/@vite/') || 
    url.searchParams.has('t') || 
    url.searchParams.has('v') ||
    url.pathname.includes('hot-reload') ||
    url.pathname.includes('browser-sync')
  ) {
    return;
  }

  // 3. Skip API requests (so they are always network-only and don't trigger SW errors)
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/supabase/')) {
    return;
  }

  // For navigation requests (HTML pages), try network first, fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache or fallback to root
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // For images and static assets, cache-first strategy
  if (
    event.request.destination === 'image' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    url.pathname.includes('/assets/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response immediately
          // Also update cache in background (fail silently)
          fetch(event.request).then((response) => {
            if (response && response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch and cache
        return fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch((error) => {
            // Silently fail if fetch fails, but don't return undefined to respondWith
            // Return null or let it be handled by the browser if possible
            // For destination 'image', it's okay to fail
            // For others, return nothing or a placeholder
            console.warn('SW Fetch fail:', event.request.url, error);
            // Returning undefined here will still cause the convert-to-Response error
            // Better to return the browser's default behavior or a custom response
            throw error; // Let it propagate if we have no fallback
          });
      })
    );
    return;
  }

  // For other requests, network first
  event.respondWith(
    fetch(event.request)
      .catch((error) => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // If no cache match, re-throw so the browser shows its error UI
          // OR return a dummy response to avoid console noise
          throw error;
        });
      })
  );
});

