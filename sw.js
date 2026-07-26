const CACHE_NAME = 'hitjamparty-v1.1';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json'
];

// Bestanden cachen bij installatie
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Bestanden serveren vanuit de cache wanneer offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
