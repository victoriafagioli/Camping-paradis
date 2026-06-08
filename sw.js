// ── Service Worker — Camping Paradis ────────────────────────────────
const CACHE_NAME = 'camping-paradis-v1';
const ASSETS = [
  '/Camping-paradis/',
  '/Camping-paradis/index.html',
  '/Camping-paradis/manifest.json',
  '/Camping-paradis/images/camping-hero.jpg',
  '/Camping-paradis/meteo.html',
  '/Camping-paradis/horaires.html',
  '/Camping-paradis/plan.html',
  '/Camping-paradis/checkin.html',
  '/Camping-paradis/pot-accueil.html',
  '/Camping-paradis/kayak.html',
  '/Camping-paradis/laverie.html',
  '/Camping-paradis/locations.html',
  '/Camping-paradis/restaurant.html',
  '/Camping-paradis/epicerie.html',
  '/Camping-paradis/gorges-ain.html',
  '/Camping-paradis/visite-nantua.html',
  '/Camping-paradis/sous-la-pluie.html'
];

// Installation : mise en cache des ressources
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Cache ouvert');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch : réseau en priorité, cache en fallback
self.addEventListener('fetch', function(e) {
  // Ne pas intercepter les requêtes API météo
  if (e.request.url.includes('open-meteo.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(resp) {
        // Mettre à jour le cache avec la réponse réseau
        var respClone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, respClone);
        });
        return resp;
      })
      .catch(function() {
        // Réseau indisponible → utiliser le cache
        return caches.match(e.request);
      })
  );
});
