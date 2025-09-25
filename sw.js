const CACHE_NAME = 'pwa-game-v3';
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './manifest.json',
    './favicon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                
                // Don't serve index.html for static assets
                const url = new URL(event.request.url);
                const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|svg|ico|json)$/.test(url.pathname);
                
                // For navigation requests (HTML pages), serve index.html to handle client-side routing
                if (!isStaticAsset && (event.request.mode === 'navigate' || 
                    (event.request.method === 'GET' && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')))) {
                    return caches.match('./index.html');
                }
                
                return fetch(event.request);
            })
            .catch(() => {
                // If both cache and network fail, serve index.html for navigation requests only
                const url = new URL(event.request.url);
                const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|svg|ico|json)$/.test(url.pathname);
                
                if (!isStaticAsset && event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});