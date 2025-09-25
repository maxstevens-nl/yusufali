const CACHE_NAME = 'pwa-game-v4';
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './manifest.json',
    './favicon.png'
];

self.addEventListener('install', (event) => {
    // Skip waiting to activate immediately
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', (event) => {
    // Take control immediately
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|svg|ico|json)$/.test(url.pathname);
    
    // For JavaScript and CSS files, always try network first for fresh content
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone the response for caching
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails, serve from cache
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // For HTML pages (navigation requests), handle SPA routing
    if (!isStaticAsset && (event.request.mode === 'navigate' || 
        (event.request.method === 'GET' && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')))) {
        event.respondWith(
            fetch('./index.html')
                .then((response) => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put('./index.html', responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails, serve cached index.html
                    return caches.match('./index.html');
                })
        );
        return;
    }
    
    // For other resources, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});