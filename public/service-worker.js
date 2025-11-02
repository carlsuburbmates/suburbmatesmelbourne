/**
 * Suburbmates Service Worker
 * Provides offline caching for homepage, directory, and profile pages
 */

const CACHE_NAME = 'suburbmates-v1';
const RUNTIME_CACHE = 'suburbmates-runtime-v1';

// Files to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Add other critical assets
];

// Routes to cache on demand
const CACHE_ROUTES = [
  '/',
  '/directory',
  '/business/',
  '/auth',
  '/dashboard',
  '/vendor-dashboard'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Skip API requests (let them go to network)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/trpc/')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }

        // Clone the request for network fetch
        const networkRequest = request.clone();
        
        return fetch(networkRequest)
          .then(response => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Check if this route should be cached
            const shouldCache = CACHE_ROUTES.some(route => {
              if (route.endsWith('/')) {
                return url.pathname.startsWith(route);
              }
              return url.pathname === route || url.pathname === route + '/';
            });

            if (shouldCache) {
              // Clone the response for caching
              const responseToCache = response.clone();
              
              caches.open(RUNTIME_CACHE)
                .then(cache => {
                  console.log('Service Worker: Caching runtime request', request.url);
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(error => {
            console.error('Service Worker: Network fetch failed', error);
            
            // Serve offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/').then(response => {
                return response || new Response('Offline - Please check your connection', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
              });
            }
            
            throw error;
          });
      })
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle offline actions when back online
  }
});

console.log('Service Worker: Script loaded');