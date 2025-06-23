// Service Worker for ShoeFit - Running Shoe Tracker PWA
// Version 1.0.0

const CACHE_NAME = 'shoefit-v1.0.0';
const STATIC_CACHE = 'shoefit-static-v1.0.0';
const DYNAMIC_CACHE = 'shoefit-dynamic-v1.0.0';
const IMAGE_CACHE = 'shoefit-images-v1.0.0';
const API_CACHE = 'shoefit-api-v1.0.0';

// Cache configuration
const CACHE_CONFIG = {
  maxEntries: {
    dynamic: 100,
    images: 200,
    api: 50
  },
  maxAgeSeconds: {
    static: 30 * 24 * 60 * 60, // 30 days
    dynamic: 7 * 24 * 60 * 60,  // 7 days
    images: 30 * 24 * 60 * 60,  // 30 days
    api: 5 * 60                 // 5 minutes
  }
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other static assets as needed
];

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/',
  '/shoes',
  '/runs',
  '/collections',
  '/profile'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/shoes',
  '/api/runs',
  '/api/collections',
  '/api/stats'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== IMAGE_CACHE &&
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and Chrome extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/storage/')) {
    // Convex file storage - cache images
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.startsWith('/api/') || url.hostname.includes('convex')) {
    // API requests - network first with cache fallback
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    // Navigation requests - app shell strategy
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(request)) {
    // Static assets - cache first
    event.respondWith(handleStaticRequest(request));
  } else {
    // Other requests - network first
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle image requests with caching
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);

  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);

      // Manage cache size
      await manageCacheSize(IMAGE_CACHE, CACHE_CONFIG.maxEntries.images);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Image request failed:', error);

    // Return placeholder image for failed requests
    return new Response(
      await getPlaceholderImage(),
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    // Network first strategy
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful GET responses
      if (request.method === 'GET') {
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);

        // Set cache expiration
        setTimeout(() => {
          cache.delete(request);
        }, CACHE_CONFIG.maxAgeSeconds.api * 1000);
      }
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', error);

    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add offline header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-By', 'serviceworker-cache');
      headers.set('X-Cache-Date', new Date().toISOString());

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }

    // Return offline response
    return createOfflineResponse(request);
  }
}

// Handle navigation requests (app shell)
async function handleNavigationRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving cached version:', error);

    // Try to serve from cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to app shell
    return cache.match('/') || cache.match('/index.html');
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);

  // Cache first strategy
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Static request failed:', error);
    throw error;
  }
}

// Handle dynamic requests
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    // Network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);

      // Manage cache size
      await manageCacheSize(DYNAMIC_CACHE, CACHE_CONFIG.maxEntries.dynamic);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Dynamic request failed, trying cache:', error);

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Utility functions
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' &&
          request.headers.get('accept').includes('text/html'));
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];

  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.includes('/static/') ||
         url.pathname.includes('/assets/');
}

// Manage cache size
async function manageCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Create offline response
function createOfflineResponse(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    // API offline response
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'This request is not available offline',
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'serviceworker-offline'
        }
      }
    );
  }

  // Generic offline page
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Offline - ShoeFit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 40px;
          }
          h1 { color: #3b82f6; margin-bottom: 10px; }
          p { line-height: 1.6; margin-bottom: 20px; }
          .retry-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          }
          .retry-btn:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📱</div>
          <h1>You're Offline</h1>
          <p>It looks like you're offline. ShoeFit works offline too! You can still view your cached data and add new entries.</p>
          <p>Your changes will be synced when you're back online.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-Served-By': 'serviceworker-offline'
      }
    }
  );
}

// Get placeholder image
async function getPlaceholderImage() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#f3f4f6"/>
    <text x="200" y="150" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="18">
      Image not available offline
    </text>
    <circle cx="200" cy="120" r="30" fill="#e5e7eb"/>
    <path d="M185 110 L185 130 L215 130 L215 110 Z M190 115 L190 125 L210 125 L210 115 Z" fill="#9ca3af"/>
  </svg>`;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connectivity is restored
async function syncOfflineData() {
  try {
    // Notify the main app to start syncing
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_REQUESTED',
        timestamp: Date.now()
      });
    });

    console.log('[SW] Sync request sent to main app');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle push notifications (for future implementation)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'New update available',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ShoeFit', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.matchAll().then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Handle messages from main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls)
    );
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    await cache.addAll(urls);
    console.log('[SW] URLs cached successfully:', urls.length);
  } catch (error) {
    console.error('[SW] Failed to cache URLs:', error);
  }
}

// Periodic cleanup
setInterval(async () => {
  try {
    // Clean up expired cache entries
    await cleanupExpiredCache();
    console.log('[SW] Cache cleanup completed');
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}, 60 * 60 * 1000); // Run every hour

async function cleanupExpiredCache() {
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    if (cacheName.includes('api')) {
      // API cache has shorter TTL
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const cacheDate = response.headers.get('X-Cache-Date');
          if (cacheDate) {
            const age = Date.now() - new Date(cacheDate).getTime();
            if (age > CACHE_CONFIG.maxAgeSeconds.api * 1000) {
              await cache.delete(request);
            }
          }
        }
      }
    }
  }
}

console.log('[SW] Service worker script loaded');
