// 1. Verander dit nummer (bijv. naar v2, v3) telkens als je de app updatet!
const CACHE_NAME = 'hitjamparty-v6.2'; // Verhoogd naar v6!

const ASSETS = [
  '.',
  'index.html',
  'login.html',
  'style.css',      // Toegevoegd!
  'app.js',         // Toegevoegd!
  'manifest.json',
  'songs.json'
];

// Bestanden cachen bij installatie
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // Forceer de nieuwe service worker om direct actief te worden
  );
});

// Verwijder oude caches automatisch
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Oude cache opgeruimd:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Zorg dat alle tabbladen meteen de nieuwe versie gebruiken
  );
});

// Bestanden serveren vanuit de cache
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

